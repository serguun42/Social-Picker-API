import { exec } from 'child_process';
import { createHash } from 'crypto';
import { resolve as pathResolve } from 'path';
import { createWriteStream } from 'fs';
import { unlink, stat } from 'fs/promises';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
import LogMessageOrError from './log.js';

const TEMP_FOLDER = process.env.TEMP || '/tmp/';

/**
 * @param {string} sourceVideoURL
 * @param {string} [targetExtension] `mp4` or any other supported
 * @param {string} [targetVideoCodec] `h264`, 'copy` or any other supported
 * @param {string} [targetAudioCodec] `copy`, `aac` or any other supported
 * @returns {Promise<import('../types/social-post').VideoCodecConverted>}
 */
const VideoCodecConvert = (
  sourceVideoURL,
  targetExtension = 'mp4',
  targetVideoCodec = 'h264',
  targetAudioCodec = 'copy'
) => {
  if (!sourceVideoURL) return Promise.reject(new Error('No video URL'));

  const baseFilename = `socialpicker_${createHash('sha256').update(`${sourceVideoURL}_${Date.now()}`).digest('hex')}`;
  const inputFilename = pathResolve(TEMP_FOLDER, `${baseFilename}_in`);
  const outputFilename = pathResolve(TEMP_FOLDER, `${baseFilename}_out.${targetExtension}`);

  const DeleteTempFile = () => {
    unlink(inputFilename).catch(() => {});
  };

  const DeleteConvertedFile = () => {
    unlink(outputFilename).catch(() => {});
  };

  return fetch(sourceVideoURL)
    .then((response) => {
      if (response.status !== 200)
        return Promise.reject(new Error(`Response status on video (${sourceVideoURL}) is ${response.status}`));

      return pipeline(response.body, createWriteStream(inputFilename));
    })
    .then(
      () =>
        new Promise((ffmpegResolve, ffmpegReject) => {
          const ffmpegCommand = `ffmpeg -i "${inputFilename}" -c:v ${targetVideoCodec || 'h264'} -c:a ${
            targetAudioCodec || 'copy'
          } "${outputFilename}"`;

          const ffmpegProcess = exec(ffmpegCommand, { cwd: TEMP_FOLDER }, (error, _stdout, stderr) => {
            if (error || stderr) {
              ffmpegProcess.kill();
              ffmpegReject(error || new Error(stderr));
            }
          });

          ffmpegProcess.on('error', (e) => ffmpegReject(e));
          ffmpegProcess.on('exit', (code, signal) => {
            if (!code) ffmpegResolve();
            else ffmpegReject(new Error(`ffmpeg exited with code ${code}${signal ? `/signal ${signal}` : ''}`));
          });
        })
    )
    .then(() => {
      DeleteTempFile();

      return stat(outputFilename)
        .then((stats) =>
          Promise.resolve({
            filename: outputFilename,
            fileCallback: DeleteConvertedFile,
            filesize: stats.size,
          })
        )
        .catch(() =>
          Promise.resolve({
            filename: outputFilename,
            fileCallback: DeleteConvertedFile,
          })
        );
    })
    .catch((e) => {
      LogMessageOrError(e);
      DeleteTempFile();
      DeleteConvertedFile();
      return Promise.resolve({ externalUrl: sourceVideoURL });
    });
};

export default VideoCodecConvert;
