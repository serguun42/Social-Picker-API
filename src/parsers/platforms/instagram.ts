import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import YTDlpWrap from 'yt-dlp-wrap';

import { GalleryDLInstagramMediaType } from '../../types/gallery-dl.js';
import { Media, SocialPost } from '../../types/social-post.js';
import { YtDlpOutput } from '../../types/yt-dlp.js';
import FormViewerURL from '../../util/links/form-viewer-url.js';
import { SafeParseURL } from '../../util/links/urls.js';
import loadConfig from '../../util/load-configs.js';
import LogMessageOrError from '../../util/log.js';
import VideoAudioMerge from '../../util/media/video-audio-merge.js';
import galleryDL from '../common/gallery-dl.js';

const { INSTAGRAM_COOKIE_FILE_LOCATION } = loadConfig('tokens');
const { PROXY_HOSTNAME, PROXY_PORT } = loadConfig('service');

// eslint-disable-next-line new-cap
const ytDlpClient = new YTDlpWrap.default();

export default async function Instagram(url: URL): Promise<SocialPost | undefined> {
  if (!INSTAGRAM_COOKIE_FILE_LOCATION) return Promise.resolve(undefined);

  const cookiesFileExists = await stat(resolve(INSTAGRAM_COOKIE_FILE_LOCATION))
    .then((stats) => {
      if (!stats.isFile()) return Promise.reject(new Error(`${INSTAGRAM_COOKIE_FILE_LOCATION} is not a file`));

      return true;
    })
    .catch((e) => {
      LogMessageOrError(e);
      return false;
    });

  if (!cookiesFileExists) return Promise.resolve(undefined);

  const POST_PATHNAME_RX = /^\/p\/[\w-]+\/?$/i;
  const REEL_PATHNAME_RX = /^\/reel\/[\w-]+\/?$/i;

  if (POST_PATHNAME_RX.test(url.pathname))
    return galleryDL<'instagram'>(url.href, resolve(INSTAGRAM_COOKIE_FILE_LOCATION)).then((parsedPost) => {
      if (!Array.isArray(parsedPost)) return Promise.reject(new Error("gallery-dl didn't return an array"));

      const username =
        parsedPost
          .map((item) => (item[0] === 2 ? item[1]?.username : item[0] === 3 ? item[2]?.username : undefined))
          .find((author) => typeof author === 'string' && !!author) || '';

      const socialPost: SocialPost = {
        author: username,
        authorURL: `https://instagram.com/${username}`,
        caption:
          parsedPost
            .map((item) => (item[0] === 2 ? item[1]?.description?.trim() : undefined))
            .find((description) => !!description?.trim()) || '',
        postURL: new URL(url.pathname, url.origin).href,
        medias: parsedPost
          .filter((item) => item[0] === 3)
          .filter(
            (item) =>
              typeof item[1] === 'string' &&
              (['reel', 'post'] satisfies GalleryDLInstagramMediaType[]).includes(item[2]?.type)
          )
          .map(
            (item): Media => ({
              type: item[2].video_url ? 'video' : 'photo',
              externalUrl: FormViewerURL(
                item[2].video_url || item[1],
                new URL(item[2].video_url || item[1]).origin,
                true
              ),
              original: FormViewerURL(item[2].video_url || item[1], new URL(item[2].video_url || item[1]).origin, true),
            })
          )
          .filter(Boolean),
      };

      return socialPost;
    });

  if (REEL_PATHNAME_RX.test(url.pathname)) {
    const ytDlpArgs = [
      url.href,
      '--dump-json',
      ...(PROXY_HOSTNAME && PROXY_PORT ? ['--proxy', `socks5://${PROXY_HOSTNAME}:${PROXY_PORT}`] : []),
      '--cookies',
      INSTAGRAM_COOKIE_FILE_LOCATION,
    ].filter((arg): arg is string => !!arg);

    return ytDlpClient
      .execPromise(ytDlpArgs)
      .then(
        (ytDlpPlainOutput) =>
          new Promise((ytDLPResolve: (ytDlpOutput: YtDlpOutput) => void, reject) => {
            try {
              const parsedYtDlp = JSON.parse(ytDlpPlainOutput);
              ytDLPResolve(parsedYtDlp);
            } catch (e) {
              reject(e);
            }
          })
      )
      .then((ytDlpOutput) => {
        const socialPost: SocialPost = {
          caption: ytDlpOutput.description || '',
          postURL: ytDlpOutput.webpage_url,
          author: ytDlpOutput.uploader,
          authorURL: `https://instagram.com/${ytDlpOutput.uploader_url || ''}`,
          medias: [],
        };

        const videoOnlyFormats = ytDlpOutput.formats.filter(
          (format) =>
            typeof format.vcodec === 'string' &&
            format.vcodec !== 'none' &&
            (typeof format.acodec !== 'string' || !format.acodec || format.acodec === 'none')
        );
        const bestVideoOnlyFormat = videoOnlyFormats
          .sort(
            (prev, next) => (prev.filesize || prev.filesize_approx || 0) - (next.filesize || next.filesize_approx || 0)
          )
          .pop();

        const audioOnlyFormats = ytDlpOutput.formats.filter(
          (format) =>
            typeof format.acodec === 'string' &&
            format.acodec !== 'none' &&
            (typeof format.vcodec !== 'string' || !format.vcodec || format.vcodec === 'none')
        );
        const bestAudioOnlyFormat = audioOnlyFormats
          .sort(
            (prev, next) => (prev.filesize || prev.filesize_approx || 0) - (next.filesize || next.filesize_approx || 0)
          )
          .pop();

        return VideoAudioMerge(bestVideoOnlyFormat?.url, bestAudioOnlyFormat?.url).then((videoResult) => {
          if ('externalUrl' in videoResult)
            socialPost.medias.push({
              externalUrl: videoResult.externalUrl,
              type: 'video',
            });
          else if ('filename' in videoResult)
            socialPost.medias.push({
              type: 'video',
              otherSources: {
                audioSource: videoResult.audioSource,
                videoSource: videoResult.videoSource,
              },
              filename: videoResult.filename,
              filetype: SafeParseURL(videoResult.videoSource).pathname.split('.').pop(),
              fileCallback: videoResult.fileCallback,
            });

          return Promise.resolve(socialPost);
        });
      });
  }

  return Promise.resolve(undefined);
}
