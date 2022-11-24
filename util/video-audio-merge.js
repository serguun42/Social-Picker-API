/* eslint-disable new-cap */
import { exec } from 'child_process';
import { createHash } from 'crypto';
import { resolve as pathResolve } from 'path';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
import LogMessageOrError from './log.js';

const TEMP_FOLDER = process.env.TEMP || '/tmp/';

/**
 * @typedef {Object} VideoAudioMergeOptions
 * @property {boolean} [loopVideo]
 * @property {boolean} [loopAudio]
 */
/**
 * @param {string} video
 * @param {string} audio
 * @param {VideoAudioMergeOptions} [options]
 * @returns {Promise<import('../types/social-post').VideoAudioMerged>}
 */
const VideoAudioMerge = (video, audio, options = {}) => {
  if (!video) return Promise.reject(new Error('No video URL'));
  if (!audio) return Promise.resolve({ externalUrl: video });

  const videoBaseFilename = `socialpicker_${createHash('sha256').update(`${video}_${Date.now()}`).digest('hex')}`;
  const videoFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_video`);
  const videoFiletype = video.replace(/\?.*$/, '').match(/\.(\w+)$/)?.[1] || 'mp4';
  const audioFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_audio`);
  const mergedFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_out.${videoFiletype}`);

  const DeleteTempFiles = () => {
    unlink(videoFilename).catch(() => {});
    unlink(audioFilename).catch(() => {});
  };

  const DeleteMergedFile = () => {
    unlink(mergedFilename).catch(() => {});
  };

  return fetch(video)
    .then((response) => {
      if (response.status !== 200)
        return Promise.reject(new Error(`Response status on video (${video}) is ${response.status}`));

      return pipeline(response.body, createWriteStream(videoFilename));
    })
    .then(() => fetch(audio))
    .then((response) => {
      if (response.status !== 200)
        return Promise.reject(new Error(`Response status on audio (${audio}) is ${response.status}`));

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
          ffmpegProcess.on('exit', () => ffmpegResolve());
        })
    )
    .then(() => {
      DeleteTempFiles();

      return Promise.resolve({
        filename: mergedFilename,
        fileCallback: DeleteMergedFile,
        videoSource: video,
        audioSource: audio,
      });
    })
    .catch((e) => {
      LogMessageOrError(e);
      DeleteTempFiles();
      DeleteMergedFile();
      return Promise.resolve({ externalUrl: video });
    });
};

export default VideoAudioMerge;
