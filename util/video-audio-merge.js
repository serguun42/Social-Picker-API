/* eslint-disable new-cap */
import { createHash } from 'crypto';
import { resolve as pathResolve } from 'path';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
import ffmpeg from 'ffmpeg';
import LogMessageOrError from './log.js';

const TEMP_FOLDER = process.env.TEMP || '/tmp/';

/**
 * @param {string} video
 * @param {string} audio
 * @returns {Promise<import('../types/media-post').CombinedVideoResult>}
 */
const VideoAudioMerge = (video, audio) => {
  if (!video) return Promise.reject(new Error('No video URL'));
  if (!audio) return Promise.resolve({ externalUrl: video });

  const videoBaseFilename = `socialpicker_${createHash('sha256').update(`${video}_${Date.now()}`).digest('hex')}`;
  const videoFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_video`);
  const videoFiletype = video.replace(/\?.*$/, '').match(/\.(\w+)$/)?.[1] || 'mp4';
  const audioFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_audio`);
  const outFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_out.${videoFiletype}`);

  const LocalDeleteTempFiles = () => {
    unlink(videoFilename).catch(() => {});
    unlink(audioFilename).catch(() => {});
    unlink(outFilename).catch(() => {});
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
    .then(() => new ffmpeg(videoFilename))
    .then(
      (ffmpegInstance) =>
        new Promise((resolve, reject) => {
          ffmpegInstance.addInput(audioFilename);
          ffmpegInstance.addCommand('-c:v', 'copy');
          ffmpegInstance.addCommand('-c:a', 'aac');
          ffmpegInstance.addCommand('-qscale', '0');
          ffmpegInstance.save(outFilename, (e) => {
            if (e) {
              reject(e);
              return;
            }

            resolve({
              filename: outFilename,
              fileCallback: LocalDeleteTempFiles,
              videoSource: video,
              audioSource: audio,
            });
          });
        })
    )
    .catch((e) => {
      LogMessageOrError(e);
      LocalDeleteTempFiles();
      return Promise.resolve({ externalUrl: video });
    });
};

export default VideoAudioMerge;
