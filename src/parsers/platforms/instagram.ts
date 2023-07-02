import YTDlpWrap from 'yt-dlp-wrap';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import LoadConfig from '../../util/load-configs.js';
import DEFAULT_HEADERS from '../default-headers.js';
import YtDlpOutput from '../../types/yt-dlp.js';
import { Media, SocialPost } from '../../types/social-post.js';
import InstagramPageWithPost from '../../types/instagram.js';
import VideoAudioMerge from '../../util/video-audio-merge.js';
import { SafeParseURL } from '../../util/urls.js';

const { PROXY_HOSTNAME, PROXY_PORT } = LoadConfig('service');
const PROXY_AGENT =
  PROXY_HOSTNAME && PROXY_PORT ? new SocksProxyAgent(`socks5://${PROXY_HOSTNAME}:${PROXY_PORT}`) : undefined;

const { INSTAGRAM_COOKIE_ONE_LINE_FOR_POSTS, INSTAGRAM_COOKIE_FILE_LOCATION_FOR_REELS } = LoadConfig('tokens');

// eslint-disable-next-line new-cap
const ytDlpClient = new YTDlpWrap.default();

export default function Instagram(url: URL): Promise<SocialPost | undefined> {
  const POST_PATHNAME_RX = /^\/p\/[\w-]+\/?$/i;
  const REEL_PATHNAME_RX = /^\/reel\/[\w-]+\/?$/i;

  if (POST_PATHNAME_RX.test(url.pathname))
    return fetch(`https://${url.hostname}${url.pathname}?__a=1&__d=dis`, {
      headers: {
        ...DEFAULT_HEADERS,
        referer: 'https://www.instagram.com/',
        cookie: INSTAGRAM_COOKIE_ONE_LINE_FOR_POSTS,
      },
      agent: PROXY_AGENT,
    })
      .then((res) => {
        if (res.ok) return res.json() as Promise<InstagramPageWithPost>;
        return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
      })
      .then((graphData) => {
        const post = graphData?.items?.[0];

        if (!post) return Promise.reject(new Error(`No post in... post: https://${url.hostname}${url.pathname}`));

        const socialPost: SocialPost = {
          caption: post?.caption?.text || '',
          postURL: `https://instagram.com${url.pathname}`,
          author: post?.user?.username,
          authorURL: `https://instagram.com/${post?.user?.username}`,
          medias: [],
        };

        const singleVideo = post.video_versions;
        const singleImage = post.image_versions2?.candidates;
        const multipleMedia = post.carousel_media;

        if (multipleMedia) {
          socialPost.medias = multipleMedia
            .map((media): Media | null => {
              if (!media) return null;

              if (media.video_versions)
                return {
                  type: 'video',
                  externalUrl: media.video_versions?.pop()?.url,
                };

              const candidates = media?.image_versions2?.candidates;

              return {
                type: 'photo',
                externalUrl: candidates.sort((prev, next) => next.width - prev.width)?.[0]?.url,
              };
            })
            .filter((media): media is Media => !!media);
        } else if (singleVideo) {
          socialPost.medias = [
            {
              type: 'video',
              externalUrl: singleVideo.sort((prev, next) => next.width - prev.width)?.[0]?.url,
            },
          ];
        } else if (singleImage) {
          socialPost.medias = [
            {
              type: 'photo',
              externalUrl: singleImage.sort((prev, next) => next.width - prev.width)?.[0]?.url,
            },
          ];
        }

        return Promise.resolve(socialPost);
      });

  if (REEL_PATHNAME_RX.test(url.pathname)) {
    const ytDlpArgs: string[] = [
      url.href,
      '--dump-json',
      PROXY_HOSTNAME && PROXY_PORT ? '--proxy' : '',
      PROXY_HOSTNAME && PROXY_PORT ? `socks5://${PROXY_HOSTNAME}:${PROXY_PORT}` : '',
      '--cookies',
      INSTAGRAM_COOKIE_FILE_LOCATION_FOR_REELS,
    ].filter(Boolean);

    return ytDlpClient
      .execPromise(ytDlpArgs)
      .then(
        (ytDlpPlainOutput) =>
          new Promise((resolve: (ytDlpOutput: YtDlpOutput) => void, reject) => {
            try {
              const parsedYtDlp = JSON.parse(ytDlpPlainOutput);
              resolve(parsedYtDlp);
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
