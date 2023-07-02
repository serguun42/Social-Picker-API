import { exec } from 'child_process';
import { createHash } from 'crypto';
import { resolve as pathResolve } from 'path';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
import LogMessageOrError from './log.js';
import { VideoAudioMerged } from '../types/social-post.js';

const TEMP_FOLDER = process.env.TEMP || '/tmp/';

type VideoAudioMergeOptions = {
  loopVideo?: boolean | undefined;
  loopAudio?: boolean | undefined;
};

export default function VideoAudioMerge(
  videoURL: string,
  audioURL: string,
  options: VideoAudioMergeOptions = {}
): Promise<VideoAudioMerged> {
  if (!videoURL) return Promise.reject(new Error('No video URL'));
  if (!audioURL) return Promise.resolve({ externalUrl: videoURL });

  const videoBaseFilename = `socialpicker_${createHash('sha256').update(`${videoURL}_${Date.now()}`).digest('hex')}`;
  const videoFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_video`);
  const videoFiletype = videoURL.replace(/\?.*$/, '').match(/\.(\w+)$/)?.[1] || 'mp4';
  const audioFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_audio`);
  const mergedFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_out.${videoFiletype}`);

  const DeleteTempFiles = () => {
    unlink(videoFilename).catch(() => {});
    unlink(audioFilename).catch(() => {});
  };

  const DeleteMergedFile = () => {
    unlink(mergedFilename).catch(() => {});
  };

  return fetch(videoURL)
    .then((response) => {
      if (response.status !== 200)
        return Promise.reject(new Error(`Response status on video (${videoURL}) is ${response.status}`));
      if (!response.body) return Promise.reject(new Error(`Cannot read body stream on video (${videoURL})`));

      return pipeline(response.body, createWriteStream(videoFilename));
    })
    .then(() => fetch(audioURL))
    .then((response) => {
      if (response.status !== 200)
        return Promise.reject(new Error(`Response status on audio (${audioURL}) is ${response.status}`));
      if (!response.body) return Promise.reject(new Error(`Cannot read body stream on video (${audioURL})`));

      return pipeline(response.body, createWriteStream(audioFilename));
    })
    .then(
      () =>
        new Promise((ffmpegResolve, ffmpegReject) => {
          const ffmpegCommand = `ffmpeg ${options.loopVideo ? '-stream_loop -1 ' : ''}-i "${videoFilename}" ${
            options.loopAudio && !options.loopVideo ? '-stream_loop -1 ' : ''
          }-i "${audioFilename}" ${
            /** Limiting loop for 20MB */
            options.loopAudio || options.loopVideo ? '-shortest -fs 20M ' : ''
          }-c:v copy -c:a aac -qscale 0 "${mergedFilename}"`;

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
      DeleteTempFiles();

      return Promise.resolve({
        filename: mergedFilename,
        fileCallback: DeleteMergedFile,
        videoSource: videoURL,
        audioSource: audioURL,
      });
    })
    .catch((e) => {
      LogMessageOrError(e);
      DeleteTempFiles();
      DeleteMergedFile();
      return Promise.resolve({ externalUrl: videoURL });
    });
}
