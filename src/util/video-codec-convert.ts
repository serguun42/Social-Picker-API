import { exec } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve as pathResolve } from 'node:path';
import { createWriteStream } from 'node:fs';
import { unlink, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import fetch from 'node-fetch';
import LogMessageOrError from './log.js';
import { VideoCodecConverted } from '../types/social-post.js';

const TEMP_FOLDER = process.env.TEMP || '/tmp/';

export default function VideoCodecConvert(
  videoURL: string,
  /** `mp4` or any other supported */ targetExtension = 'mp4',
  /** `h264`, 'copy` or any other supported */ targetVideoCodec = 'h264',
  /** `copy`, `aac` or any other supported */ targetAudioCodec = 'copy'
): Promise<VideoCodecConverted> {
  if (!videoURL) return Promise.reject(new Error('No video URL'));

  const baseFilename = `socialpicker_${createHash('sha256').update(`${videoURL}_${Date.now()}`).digest('hex')}`;
  const inputFilename = pathResolve(TEMP_FOLDER, `${baseFilename}_in`);
  const outputFilename = pathResolve(TEMP_FOLDER, `${baseFilename}_out.${targetExtension}`);

  const DeleteTempFile = () => {
    unlink(inputFilename).catch(() => {});
  };

  const DeleteConvertedFile = () => {
    unlink(outputFilename).catch(() => {});
  };

  return fetch(videoURL)
    .then((response) => {
      if (response.status !== 200)
        return Promise.reject(new Error(`Response status on video (${videoURL}) is ${response.status}`));
      if (!response.body) return Promise.reject(new Error(`Cannot read body stream on video (${videoURL})`));

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
            if (!code) ffmpegResolve(0);
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
      return Promise.resolve({ externalUrl: videoURL });
    });
}
