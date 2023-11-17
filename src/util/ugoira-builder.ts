import { exec } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { unlink, writeFile } from 'node:fs/promises';
import JSZip from 'jszip';
import LogMessageOrError from './log.js';
import { UgoiraMeta } from '../types/pixiv.js';
import { Media } from '../types/social-post.js';

const TEMP_FOLDER = process.env.TEMP || '/tmp/';

const UGOIRA_FILE_EXTENSION = 'mp4';
const UGOIRA_MEDIA_FILETYPE: Media['type'] = 'gif';

/** Builds video sequence from Ugoira */
export default function UgoiraBuilder(ugoiraMeta: UgoiraMeta, sourceZip: ArrayBuffer): Promise<Media | null> {
  return new JSZip()
    .loadAsync(sourceZip)
    .then(async (zipAsObject) => {
      const ugoiraDelays: { [filename: string]: number } = {};
      ugoiraMeta.body.frames.forEach((frame) => {
        ugoiraDelays[frame.file] = frame.delay;
      });

      const hash = createHash('md5').update(`${ugoiraMeta.body.originalSrc}_${Date.now()}`).digest('hex');
      const outputFilename = `socialpicker_${hash}_output.${UGOIRA_FILE_EXTENSION}`;
      const outputFilepath = resolve(TEMP_FOLDER, outputFilename);

      const storedFiles: { filename: string; tempFilename: string; tempFilepath: string }[] = [];

      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const filename in zipAsObject.files) {
        const fileAsObject = zipAsObject.files[filename];
        const tempFilename = `socialpicker_${hash}_${filename.replace(/[^\w.]/g, '')}`;
        const tempFilepath = resolve(TEMP_FOLDER, tempFilename);

        // eslint-disable-next-line no-await-in-loop
        const unzipWriteResult = await fileAsObject
          .async('nodebuffer')
          .then((fileAsBuffer) => writeFile(tempFilepath, fileAsBuffer))
          .catch((e) => Promise.resolve(new Error(`Cannot unzip/write file ${filename}: ${e}`)));

        if (unzipWriteResult instanceof Error) throw unzipWriteResult;

        storedFiles.push({ filename, tempFilename, tempFilepath });
      }

      const listFilename = `socialpicker_${hash}_list.txt`;
      const listFilepath = resolve(TEMP_FOLDER, listFilename);
      const listContent = storedFiles
        .map(
          (storedFile) =>
            `file '${storedFile.tempFilename}'\nduration ${((ugoiraDelays[storedFile.filename] || 100) / 1000).toFixed(
              3
            )}`
        )
        .join('\n');

      return writeFile(listFilepath, listContent)
        .then(
          () =>
            new Promise((ffmpegResolve, ffmpegReject) => {
              const ffmpegCommand = `ffmpeg
                -f concat -i "${listFilename}"
                -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"
                "${outputFilename}"`.replace(/\n\s+/g, ' ');

              const ffmpegProcess = exec(ffmpegCommand, { cwd: TEMP_FOLDER }, (error, _stdout, stderr) => {
                if (error || stderr) {
                  ffmpegProcess.kill();
                  ffmpegReject(error || new Error(stderr));
                }
              });

              ffmpegProcess.on('error', (e) => ffmpegReject(e));
              ffmpegProcess.on('exit', (code, signal) => {
                if (!code) ffmpegResolve(0);
                else
                  ffmpegReject(
                    new Error(
                      `ffmpeg exited with code ${code}${signal ? `/signal ${signal}` : ''} (${ugoiraMeta?.body
                        ?.originalSrc})`
                    )
                  );
              });
            })
        )
        .then(() => {
          const ugoiraBuilt: Media = {
            type: UGOIRA_MEDIA_FILETYPE,
            externalUrl: ugoiraMeta.body.originalSrc,
            original: ugoiraMeta.body.originalSrc,
            otherSources: { zip: ugoiraMeta.body.originalSrc },
            filetype: UGOIRA_FILE_EXTENSION,
            filename: outputFilepath,
            fileCallback: () => {
              unlink(outputFilepath).catch(() => {});
            },
          };

          return Promise.resolve(ugoiraBuilt);
        })
        .finally(() => {
          unlink(listFilepath).catch(() => {});
          storedFiles.forEach((storedFile) => unlink(storedFile.tempFilepath).catch(() => {}));
        });
    })
    .catch((e) => {
      LogMessageOrError('UgoiraBuilder error:', e);
      return Promise.resolve(null);
    });
}
