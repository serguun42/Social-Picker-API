import { stat } from 'fs/promises';
import { exec } from 'child_process';
import fetch from 'node-fetch';
import { createClient } from 'tumblr.js';
import YTDlpWrap from 'yt-dlp-wrap';
import { parse as parseHTML } from 'node-html-parser';
import SocksProxyAgent from 'socks-proxy-agent';
import VideoAudioMerge from '../util/video-audio-merge.js';
import { SafeParseURL, ParseQuery, ParsePath } from '../util/urls.js';
import LogMessageOrError from '../util/log.js';
import { LoadServiceConfig, LoadTokensConfig } from '../util/load-configs.js';
import UgoiraBuilder from '../util/ugoira-builder.js';
import FormViewerURL from '../util/form-viewer-url.js';
import HumanReadableSize from '../util/human-readable-size.js';
import VideoCodecConvert from '../util/video-codec-convert.js';

const { PROXY_HOSTNAME, PROXY_PORT } = LoadServiceConfig();
const { TWITTER_SCAPPER, INSTAGRAM_COOKIE_ONE_LINE_FOR_POSTS, INSTAGRAM_COOKIE_FILE_LOCATION_FOR_REELS, TUMBLR_OAUTH, JOYREACTOR_COOKIE } =
  LoadTokensConfig();

const PROXY_AGENT =
  PROXY_HOSTNAME && PROXY_PORT
    ? new SocksProxyAgent.SocksProxyAgent({ hostname: PROXY_HOSTNAME, port: PROXY_PORT })
    : null;
const DEFAULT_HEADERS = {
  accept:
    // eslint-disable-next-line max-len
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'accept-language': 'en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7',
  'cache-control': 'max-age=0',
  'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

const TumblrClient = createClient({
  credentials: TUMBLR_OAUTH,
  returnPromises: true,
});

/** @type {import("yt-dlp-wrap").default} */
// eslint-disable-next-line new-cap
const ytDlpClient = new YTDlpWrap.default();

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Twitter = (url) => {
  const statusID = url.pathname.match(/^(?:\/[\w_]+)?\/status(?:es)?\/(\d+)/)?.[1];
  if (!statusID) return Promise.resolve({});

  return stat(TWITTER_SCAPPER.binary_file_path)
    .then((stats) => {
      if (!stats.isFile()) return Promise.reject(new Error(`${TWITTER_SCAPPER.binary_file_path} is not a file`));

      return new Promise((goBinaryResolve, goBinaryReject) => {
        const goBinaryCommand = [
          TWITTER_SCAPPER.binary_file_path,
          'getTweet', // one of the methods
          TWITTER_SCAPPER.cookies_file_path,
          statusID,
        ].join(' ');

        /** @type {string[]} */
        const stdoutChunks = [];

        const goBinaryProcess = exec(goBinaryCommand, { cwd: process.cwd() }, (error, stdout, stderr) => {
          if (error || stderr) {
            goBinaryProcess.kill();
            goBinaryReject(error || new Error(stderr));
          }
        });

        goBinaryProcess.stdout.on('data', (chunk) => {
          stdoutChunks.push(chunk.toString());
        });

        goBinaryProcess.stderr.on('data', (chunk) => {
          goBinaryReject(new Error(chunk.toString()));
        });

        goBinaryProcess.on('error', (e) => goBinaryReject(e));
        goBinaryProcess.on('exit', (code, signal) => {
          if (!code) goBinaryResolve(stdoutChunks.join(''));
          else
            goBinaryReject(
              new Error(
                `${TWITTER_SCAPPER.binary_file_path} exited with code ${code}${
                  signal ? `/signal ${signal}` : ''
                } (statusID ${statusID})`
              )
            );
        });
      });
    })
    .then(/** @param {string} readOutput */ (readOutput) => JSON.parse(readOutput))
    .then(
      /** @param {import('../types/social-post').SocialPost} parsedPost */ (parsedPost) => {
        if (!parsedPost.medias?.length || !parsedPost.author || !parsedPost.authorURL) return Promise.resolve({});

        if (typeof parsedPost.caption === 'string')
          parsedPost.caption = parsedPost.caption
            .replace(/\s?(?:https?:\/\/)?t.co\/\w+$/gi, '')
            .replace(/\s+/gi, ' ')
            .trim();

        return Promise.resolve(parsedPost);
      }
    );
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const TwitterDirect = (url) => {
  if (url.hostname === 'video.twimg.com') {
    url.search = '';

    return Promise.resolve({
      author: '',
      authorURL: '',
      caption: '',
      postURL: url.href,
      medias: [
        {
          type: 'video',
          externalUrl: url.href,
          original: url.href,
        },
      ],
    });
  }

  const format = ParseQuery(url.query)?.format || 'jpg';
  const mediaPathname = url.pathname.replace(/:\w+$/, '').replace(/\.\w+$/, '');

  return Promise.resolve({
    author: '',
    authorURL: '',
    caption: '',
    postURL: `https://pbs.twimg.com${mediaPathname}.${format}`,
    medias: [
      {
        type: 'photo',
        externalUrl: `https://pbs.twimg.com${mediaPathname}.${format}`,
        original: `https://pbs.twimg.com${mediaPathname}.${format}:orig`,
      },
    ],
  });
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Instagram = (url) => {
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
        if (res.ok) return res.json();
        return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
      })
      .then((graphData) => {
        const post = graphData?.items?.[0];

        if (!post) return Promise.reject(new Error(`No post in... post: https://${url.hostname}${url.pathname}`));

        /** @type {import("../types/social-post").SocialPost} */
        const socialPost = {
          caption: post?.caption?.text || '',
          postURL: `https://instagram.com${url.pathname}`,
          author: post?.user?.username,
          authorURL: `https://instagram.com/${post?.user?.username}`,
        };

        const singleVideo = post.video_versions;
        const singleImage = post.image_versions2?.candidates;
        const multipleMedia = post.carousel_media;

        if (singleVideo) {
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
        } else if (multipleMedia) {
          socialPost.medias = multipleMedia
            .map(
              /** @returns {import("../types/social-post").Media} */ (media) => {
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
              }
            )
            .filter(Boolean);
        }

        return Promise.resolve(socialPost);
      });

  if (REEL_PATHNAME_RX.test(url.pathname))
    return ytDlpClient
      .execPromise([
        url.href,
        '--dump-json',
        '--proxy',
        `socks5://${PROXY_HOSTNAME}:${PROXY_PORT}`,
        '--cookies',
        INSTAGRAM_COOKIE_FILE_LOCATION_FOR_REELS,
      ])
      .then(
        (ytDlpPlainOutput) =>
          new Promise((resolve, reject) => {
            try {
              const parsedYtDlp = JSON.parse(ytDlpPlainOutput);
              resolve(parsedYtDlp);
            } catch (e) {
              reject(e);
            }
          })
      )
      .then(
        /** @param {import("../types/yt-dlp").YtDlpOutput} ytDlpOutput */ (ytDlpOutput) => {
          /** @type {import("../types/social-post").SocialPost} */
          const socialPost = {
            caption: ytDlpOutput.description || '',
            postURL: ytDlpOutput.webpage_url,
            author: ytDlpOutput.uploader,
            authorURL: `https://instagram.com/${ytDlpOutput.uploader}`,
            medias: [],
          };

          const videoOnlyFormats = ytDlpOutput.formats.filter(
            (format) =>
              typeof format.vcodec === 'string' &&
              format.vcodec !== 'none' &&
              (typeof format.acodec !== 'string' || !format.acodec || format.acodec === 'none')
          );
          const bestVideoOnlyFormat = videoOnlyFormats
            .sort((prev, next) => (prev.filesize || prev.filesize_approx) - (next.filesize || next.filesize_approx))
            .pop();

          const audioOnlyFormats = ytDlpOutput.formats.filter(
            (format) =>
              typeof format.acodec === 'string' &&
              format.acodec !== 'none' &&
              (typeof format.vcodec !== 'string' || !format.vcodec || format.vcodec === 'none')
          );
          const bestAudioOnlyFormat = audioOnlyFormats
            .sort((prev, next) => (prev.filesize || prev.filesize_approx) - (next.filesize || next.filesize_approx))
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
        }
      );

  return Promise.resolve({});
};

/**
 * @param {URL} url
 * @param {number} [certainImageIndex] Unique parameter only for parser `PixivDirect`
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Pixiv = (url, certainImageIndex) => {
  const PIXIV_PAGE_RX = /^\/(?:\w{2}\/)?artworks\/(?<illustId>\d+)/i;
  const PIXIV_HEADERS = {
    ...DEFAULT_HEADERS,
    referer: 'https://www.pixiv.net/',
  };

  const pageMatch = url.pathname.match(PIXIV_PAGE_RX);
  /** @type {string} */
  const illustId = pageMatch?.groups?.illustId || ParseQuery(url.search).illust_id;
  if (!illustId) return Promise.resolve({});

  const postURL = `https://www.pixiv.net/en/artworks/${illustId}`;

  return fetch(postURL, { headers: PIXIV_HEADERS, agent: PROXY_AGENT })
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((pixivPage) => {
      try {
        const parsedHTML = parseHTML(pixivPage);

        const metaPreloadData = parsedHTML.getElementById('meta-preload-data');
        if (!metaPreloadData) throw new Error('No <metaPreloadData> in <pixivPage>');

        const preloadContentRaw = metaPreloadData.getAttribute('content');
        if (!preloadContentRaw) throw new Error('No <preloadContent> in <metaPreloadData>');

        const preloadContentParsed = JSON.parse(preloadContentRaw);
        return Promise.resolve(preloadContentParsed);
      } catch (e) {
        return Promise.reject(e);
      }
    })
    .then(
      /** @param {import("../types/pixiv").PixivPreload} pixivPreload */ (pixivPreload) => {
        const post = pixivPreload?.illust?.[illustId];
        if (!post) return Promise.reject(new Error(`No <post> in preloadContent: ${postURL}`));

        /** @type {import("../types/social-post").SocialPost} */
        const socialPost = {
          caption: post.title || post.illustTitle || post.description || post.illustComment,
          author: post.userName,
          authorURL: `https://www.pixiv.net/en/users/${post.userId}`,
          postURL,
          medias: [],
        };

        /**
         * Aka GIF stored as jpg/png in zip
         * @type {boolean}
         */
        const isUgoira =
          Object.keys(post.urls || {})
            .map((key) => post.urls[key] || '')
            .some((firstImgUrl) => typeof firstImgUrl === 'string' && /ugoira/i.test(firstImgUrl)) ||
          post.tags?.tags?.some((tag) => /ugoira/i.test(tag.romaji));

        if (isUgoira) {
          const ugoiraMetaUrl = `https://www.pixiv.net/ajax/illust/${illustId}/ugoira_meta`;

          return fetch(ugoiraMetaUrl, { headers: PIXIV_HEADERS, agent: PROXY_AGENT })
            .then((res) => {
              if (res.ok) return res.json();
              return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
            })
            .then(
              /** @param {import('../types/pixiv').UgoiraMeta} ugoiraMeta */ (ugoiraMeta) => {
                const uroiraOriginalZip = ugoiraMeta.body.originalSrc;
                return fetch(uroiraOriginalZip, { headers: PIXIV_HEADERS, agent: PROXY_AGENT })
                  .then((res) => {
                    if (res.ok) return res.arrayBuffer();
                    return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
                  })
                  .then((ugoiraSourceZip) => UgoiraBuilder(ugoiraMeta, ugoiraSourceZip))
                  .then((ugoiraBuilt) => {
                    socialPost.medias.push({ ...ugoiraBuilt });
                    return Promise.resolve(socialPost);
                  });
              }
            );
        }

        /** Extremely dirty backup way to extract anything valuable from Pixiv post */
        const { dirtyImageDate, dirtyImageFiletype } =
          JSON.stringify(post).match(
            new RegExp(`"[^"]+(?<dirtyImageDate>img/(\\d+/){6}${illustId}_p)[^"]+\\.(?<dirtyImageFiletype>\\w+)"`)
          )?.groups || {};

        const dirtyOriginalImage =
          dirtyImageDate && dirtyImageFiletype
            ? `https://i.pximg.net/img-original/${dirtyImageDate}0.${dirtyImageFiletype}`
            : '';
        const dirtyMasterImage =
          dirtyImageDate && dirtyImageFiletype
            ? `https://i.pximg.net/img-master/${dirtyImageDate}0_master1200.${dirtyImageFiletype}`
            : '';

        const sourcesAmount = post?.pageCount;
        const origFilename = post.urls.original || dirtyOriginalImage;

        if (!origFilename)
          return Promise.reject(
            new Error(
              `No <origFilename> in post ${postURL} (${JSON.stringify(
                { dirtyImageDate, dirtyImageFiletype },
                false,
                2
              )})`
            )
          );

        const origBasename = origFilename.replace(/\d+\.(\w+)$/, '');
        const origFiletype = origFilename.match(/\.(?<filetype>\w+)$/)?.groups?.filetype || 'png';
        const masterFilename = post.urls.regular || dirtyMasterImage;

        for (let sourceIndex = 0; sourceIndex < sourcesAmount; sourceIndex++) {
          if (!(typeof certainImageIndex === 'number' && certainImageIndex !== sourceIndex))
            socialPost.medias.push({
              type: 'photo',
              externalUrl: FormViewerURL(
                masterFilename.replace(/\d+(_master\d+\.\w+$)/i, `${sourceIndex}$1`),
                'https://www.pixiv.net/',
                true
              ),
              filetype: origFiletype,
              original: FormViewerURL(`${origBasename}${sourceIndex}.${origFiletype}`, 'https://www.pixiv.net/', true),
            });
        }

        return Promise.resolve(socialPost);
      }
    );
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const PixivDirect = (url) => {
  const PIXIV_IMAGE_RX = /\/(?<illustId>\d+)_p(?<imageIndex>\d+)(?:_\w+)?\.\w+$/;
  const imageMatch = url.pathname.match(PIXIV_IMAGE_RX);
  if (!Object.keys(imageMatch?.groups || {}).length) {
    LogMessageOrError(new Error(`Bad Pixiv image url: ${url.href}`));
    return Promise.resolve({});
  }

  const { illustId, imageIndex } = imageMatch.groups;
  if (!illustId || typeof parseInt(imageIndex) !== 'number') {
    LogMessageOrError(new Error(`Bad Pixiv image url: ${url.href}`));
    return Promise.resolve({});
  }

  const pixivUrl = SafeParseURL(`https://www.pixiv.net/en/artworks/${illustId}`);
  return Pixiv(pixivUrl, parseInt(imageIndex));
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Reddit = (url) => {
  if (!url.pathname) return Promise.resolve({});

  const REDDIT_POST_REGEXP = /^(?<givenPathname>(?:\/r\/[\w-._]+)?\/comments\/[\w-.]+)(?:\/)?/i;
  const REDDIT_HEADERS = {
    ...DEFAULT_HEADERS,
    referer: 'https://www.reddit.com/',
  };

  const match = (url.hostname === 'redd.it' ? `/comments${url.pathname}` : url.pathname).match(REDDIT_POST_REGEXP);
  const givenPathname = match?.groups?.givenPathname;
  if (!givenPathname) return Promise.resolve({});

  const postURL = SafeParseURL(givenPathname, 'https://www.reddit.com').href;

  return fetch(`${postURL}.json`, { headers: REDDIT_HEADERS })
    .then((res) => {
      if (res.ok) return res.json();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then(
      /** @param {import('../types/reddit-post').RedditPost} redditPostJSON */ (redditPostJSON) => {
        const post = redditPostJSON[0]?.data?.children?.[0]?.data;
        if (!post) return Promise.reject(new Error('No <post> in <redditPost>'));

        const caption = post.title || '';
        const author = post.author || '';
        const authorURL = `https://www.reddit.com/u/${author}`;
        const imageURL = post.url || post.url_overridden_by_dest;
        const isImgur = /imgur\.com$/i.test(SafeParseURL(imageURL).hostname);
        const isGif = /\.gif$/i.test(imageURL);
        const isVideo = post.is_video;
        const isGallery = post.is_gallery;
        const crossPostParent = post.crosspost_parent;

        if (crossPostParent && typeof crossPostParent === 'string') {
          const parentId = crossPostParent.split('_')[1];
          if (!parentId) return Promise.resolve({});

          return Reddit(SafeParseURL(`/comments/${parentId}`, 'https://www.reddit.com'));
        }

        if (isVideo) {
          const video = post.secure_media?.reddit_video?.fallback_url;
          if (!video) return Promise.reject(new Error(`Reddit: ${postURL} is video but there is no secure_media`));

          const hslPlaylist = post.secure_media?.reddit_video?.hls_url;
          const videoResultPromise =
            isGif || !hslPlaylist
              ? Promise.resolve({ externalUrl: video })
              : fetch(hslPlaylist, {
                  headers: {
                    ...REDDIT_HEADERS,
                    host: SafeParseURL(hslPlaylist).hostname,
                  },
                })
                  .then((res) => {
                    if (res.ok) return res.text();
                    return Promise.reject(new Error(`Response status from Reddit ${res.status}`));
                  })
                  .then((hslFile) => {
                    const hslPlaylistLines = hslFile.split('\n');
                    const audioPlaylistLocation =
                      (hslPlaylistLines.filter((line) => /TYPE=AUDIO/i.test(line)).pop() || '').match(
                        /URI="([^"]+)"/
                      )?.[1] || '';

                    return fetch(hslPlaylist.replace(/\/[^/]+$/, `/${audioPlaylistLocation}`), {
                      headers: {
                        ...REDDIT_HEADERS,
                        host: SafeParseURL(hslPlaylist).hostname,
                      },
                    });
                  })
                  .then((res) => {
                    if (res.ok) return res.text();
                    return Promise.reject(new Error(`Response status from Reddit ${res.status}`));
                  })
                  .then((audioPlaylistFile) => {
                    const audioFilename = (
                      audioPlaylistFile
                        .split('\n')
                        .filter((line) => line && !/^#/.test(line))
                        .pop() || ''
                    ).trim();
                    if (!audioFilename) return Promise.resolve({ externalUrl: video });

                    const audio = hslPlaylist.replace(/\/[^/]+$/, `/${audioFilename}`);
                    if (!audio) return Promise.resolve({ externalUrl: video });

                    return VideoAudioMerge(video, audio).catch(() => Promise.resolve({ externalUrl: video }));
                  })
                  .catch(() => Promise.resolve({ externalUrl: video }));

          return videoResultPromise.then((videoResult) => {
            /** @type {import("../types/social-post").Media[]} */
            const videoSources = [];

            if ('externalUrl' in videoResult)
              videoSources.push({
                externalUrl: videoResult.externalUrl,
                type: isGif ? 'gif' : 'video',
              });
            else if ('filename' in videoResult)
              videoSources.push({
                type: 'video',
                otherSources: {
                  audioSource: videoResult.audioSource,
                  videoSource: videoResult.videoSource,
                },
                filename: videoResult.filename,
                filetype: SafeParseURL(videoResult.videoSource).pathname.split('.').pop(),
                fileCallback: videoResult.fileCallback,
              });

            return Promise.resolve({
              author,
              authorURL,
              postURL,
              caption,
              medias: videoSources,
            });
          });
        }

        if (isGallery)
          return Promise.resolve({
            author,
            authorURL,
            postURL,
            caption,
            medias: (post.gallery_data?.items || [])
              .map(
                /** @returns {import("../types/social-post").Media} */ (item) => {
                  const source = post.media_metadata?.[item.media_id]?.s;
                  if (!source) return null;

                  if (source.gif)
                    return {
                      type: 'gif',
                      externalUrl: source.gif,
                    };

                  try {
                    const previewUrl = SafeParseURL(source.u);

                    return {
                      type: 'photo',
                      externalUrl: `https://${previewUrl.hostname.replace(/^preview\./i, 'i.')}${previewUrl.pathname}`,
                    };
                  } catch (e) {
                    return null;
                  }
                }
              )
              .filter(Boolean),
          });

        /** @type {import('../types/social-post').Media[]} */
        const previewMedia = (post.preview?.images || [])
          .map(
            /** @returns {import('../types/social-post').Media} */ (image) => {
              if (!image?.variants) return null;

              const isGifByPresentVariant = image.variants.gif?.source?.url;
              const videoUrl = (image.variants.mp4?.source?.url || '').replace(/&amp;/g, '&');

              if (!videoUrl) return null;

              return {
                type: isGifByPresentVariant ? 'gif' : 'video',
                externalUrl: videoUrl,
                filetype: 'mp4',
              };
            }
          )
          .filter(Boolean);

        return Promise.resolve({
          author,
          authorURL,
          postURL,
          caption,
          medias: previewMedia.length
            ? previewMedia
            : /\.(jpe?g|png)$/i.test(imageURL)
            ? [
                {
                  type: isGif ? 'gif' : 'photo',
                  externalUrl: isImgur
                    ? FormViewerURL(
                        (post.preview?.images?.[0]?.source?.url || '').replace(/&amp;/g, '&') || imageURL,
                        'https://www.reddit.com',
                        true
                      )
                    : imageURL,
                },
              ]
            : [],
        });
      }
    );
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Tumblr = (url) => {
  const MAIN_DOMAIN_RX = /^\/(?<blogID>[^/]+)\/(?<postID>\d+)/i;
  const API_PATH_BASE = '/v2/blog/__BLOG_ID__/posts/__POST_ID__';

  const isSubdomain = /^\/posts?\//i.test(url.pathname);
  const blogID = isSubdomain
    ? url.hostname.replace(/\.tumblr\.(com|co\.\w+|org)$/i, '')
    : url.pathname.match(MAIN_DOMAIN_RX)?.groups?.blogID;
  const postID = isSubdomain
    ? url.pathname.match(/^\/posts?\/(?<postID>\d+)/i)?.groups?.postID
    : url.pathname.match(MAIN_DOMAIN_RX)?.groups?.postID;

  if (!blogID || !postID) return Promise.resolve({});

  const fetchingAPIPath = API_PATH_BASE.replace(/__BLOG_ID__/g, blogID).replace(/__POST_ID__/g, postID);

  return TumblrClient.getRequest(fetchingAPIPath, {}).then(
    /** @param {import("../types/tumblr").Tumblr} tumblr */ (tumblr) => {
      const content = tumblr.content?.length ? tumblr.content : tumblr.trail?.[0]?.content;
      if (!content) return Promise.reject(new Error(`No content in tumblr: ${url.pathname}`));

      /** @type {import("../types/social-post").Media[]} */
      const medias = content
        .filter((block) => block.type === 'image')
        .map((image) => {
          if (!image.media) return null;

          return image.media.sort((prev, next) => next.width - prev.width)?.[0];
        })
        .filter(Boolean)
        .map((image) => ({
          type: /\.gif$/i.test(image.url) ? 'gif' : 'photo',
          externalUrl: image.url,
        }));

      if (!medias?.length) return Promise.reject(new Error(`No medias in tumblr: ${url.pathname}`));

      const caption = content
        .filter((block) => block.type === 'text')
        .map((text) => text?.text || '')
        .join('\n\n');

      /** @type {import("../types/social-post").SocialPost} */
      const fineTumblrSocialPost = {
        author: blogID,
        authorURL: `https://${blogID}.tumblr.com`,
        caption: caption || '',
        medias,
        postURL: `https://${blogID}.tumblr.com/post/${postID}`,
      };

      return Promise.resolve(fineTumblrSocialPost);
    }
  );
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Danbooru = (url) => {
  if (!/^\/posts\/\d+/.test(url.pathname)) return Promise.resolve({});

  return fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((danbooruPage) => {
      /** @type {import("../types/social-post").SocialPost} */
      const socialPost = {
        author: '',
        authorURL: '',
        caption: '',
        postURL: url.href,
      };

      try {
        const parsedHTML = parseHTML(danbooruPage);

        const sizeAnchor = parsedHTML.querySelector('#post-info-size > a');
        if (!sizeAnchor) return Promise.reject(new Error('Danbooru no <sizeAnchor>'));

        const pictureURL = sizeAnchor.getAttribute('href');

        socialPost.medias = [
          {
            type: 'photo',
            externalUrl: pictureURL,
          },
        ];

        const uploaderAnchor = parsedHTML.querySelector('#post-info-uploader > a');
        if (uploaderAnchor) {
          socialPost.author = uploaderAnchor.getAttribute('data-user-name') || '';
          socialPost.authorURL = SafeParseURL(uploaderAnchor.getAttribute('href') || '', url.origin);
        }

        return Promise.resolve(socialPost);
      } catch (e) {
        return Promise.reject(e);
      }
    });
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Gelbooru = (url) =>
  fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((gelbooruPage) => {
      try {
        const parsedHTML = parseHTML(gelbooruPage);

        const tagList = parsedHTML.querySelector('.tag-list');
        if (!tagList) throw new Error('No <tagList> in <gelbooruPage>');

        const originalLink = tagList.querySelector(`a[href$=".jpeg"], a[href$=".jpg"], a[href$=".png"]`);
        if (!originalLink) throw new Error('No <originalLink> in <tagList>');

        const source = originalLink.getAttribute('href');
        if (!source) throw new Error('No <source> in <originalLink>');

        return Promise.resolve({
          author: '',
          authorURL: '',
          postURL: url.href,
          caption: '',
          medias: [
            {
              type: 'photo',
              externalUrl: source,
            },
          ],
        });
      } catch (e) {
        return Promise.reject(e);
      }
    });

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Konachan = (url) =>
  fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((konachanPage) => {
      let source = '';

      try {
        source = konachanPage.split('<body')[1].match(
          // eslint-disable-next-line max-len
          /<a(\s+[\w-]+="([^"]+)")*\s+href="([^"]+)"(\s+[\w-]+="([^"]+)")*\s+id="highres"(\s+[\w-]+="([^"]+)")*/i
        );

        // eslint-disable-next-line prefer-destructuring
        if (source) source = source[3];
      } catch (e) {
        return Promise.reject(new Error(['Error on parsing Konachan', url.href, e]));
      }

      if (!source) return Promise.reject(new Error(['No Konachan source', url.href]));

      return Promise.resolve({
        author: '',
        authorURL: '',
        postURL: url.href,
        caption: '',
        medias: [
          {
            type: 'photo',
            externalUrl: source,
          },
        ],
      });
    });

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Yandere = (url) =>
  fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((yanderePage) => {
      let source = '';

      try {
        source = yanderePage.split('<body')[1].match(/<a\s+class="[^"]+"\s+id="highres"\s+href="([^"]+)"/i);

        // eslint-disable-next-line prefer-destructuring
        if (source) source = source[1];
      } catch (e) {
        return Promise.reject(new Error(['Error on parsing Yandere', url.href, e]));
      }

      if (!source) return Promise.reject(new Error(['No Yandere source', url.href]));

      return Promise.resolve({
        author: '',
        authorURL: '',
        postURL: url.href,
        caption: '',
        medias: [
          {
            type: 'photo',
            externalUrl: source,
          },
        ],
      });
    });

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Eshuushuu = (url) =>
  fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((eshuushuuPage) => {
      let source = '';

      try {
        source = eshuushuuPage.split('<body')[1].match(/<a\s+class="thumb_image"\s+href="([^"]+)"/i);

        if (source && source[1])
          source = `https://e-shuushuu.net/${source[1].replace(/\/\//g, '/').replace(/^\//g, '')}`;
      } catch (e) {
        return Promise.reject(new Error(['Error on parsing Eshuushuu', url.href, e]));
      }

      if (!source) return Promise.reject(new Error(['No Eshuushuu source', url.href]));

      return Promise.resolve({
        author: '',
        authorURL: '',
        postURL: url.href,
        caption: '',
        medias: [
          {
            type: 'photo',
            externalUrl: source,
          },
        ],
      });
    });

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Sankaku = (url) =>
  fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((sankakuPage) => {
      let source = '';

      try {
        source = sankakuPage.split('<body')[1].match(/<a\s+href="([^"]+)"\s+id=(")?highres/i);

        if (source && source[1]) source = source[1].replace(/&amp;/g, '&');
      } catch (e) {
        return Promise.reject(new Error(['Error on parsing Sankaku', url.href, e]));
      }

      if (!source) return Promise.reject(new Error(['No Sankaku source', url.href]));
      if (source.slice(0, 6) !== 'https:') source = `https:${source}`;

      return Promise.resolve({
        author: '',
        authorURL: '',
        postURL: url.href,
        caption: '',
        medias: [
          {
            type: 'photo',
            externalUrl: source,
          },
        ],
      });
    });

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Zerochan = (url) =>
  fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((zerochanPage) => {
      let source = '';

      try {
        source = zerochanPage.split('</head')[0].match(/<meta\s+(name|property)="og:image"\s+content="([^"]+)"/i);

        // eslint-disable-next-line prefer-destructuring
        if (source) source = source[2];

        if (!source) {
          source = zerochanPage
            .split('</head')[0]
            .match(/<meta\s+(name|property)="twitter:image"\s+content="([^"]+)"/i);

          // eslint-disable-next-line prefer-destructuring
          if (source) source = source[2];
        }
      } catch (e) {
        return Promise.reject(new Error(['Error on parsing Zerochan', url.href, e]));
      }

      if (!source) return Promise.reject(new Error(['No Zerochan source', url.href]));

      const sourceBasename = source.replace(/\.\w+$/, '');
      const basenameMatch = zerochanPage.match(new RegExp(`${sourceBasename}.[\\w\\d]+`, 'gi'));

      if (basenameMatch && basenameMatch.pop) source = basenameMatch.pop();

      return Promise.resolve({
        author: '',
        authorURL: '',
        postURL: url.href,
        caption: '',
        medias: [
          {
            type: 'photo',
            externalUrl: source,
          },
        ],
      });
    });

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const AnimePictures = (url) =>
  fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((animePicturesPage) => {
      try {
        const parsedHTML = parseHTML(animePicturesPage);

        const link = parsedHTML.getElementById('get_image_link');
        if (!link) throw new Error('No <link> in <parsedHTML>');

        const source = link.getAttribute('href');
        if (!source) throw new Error('No <source> in <link>');

        return Promise.resolve({
          author: '',
          authorURL: '',
          postURL: url.href,
          caption: '',
          medias: [
            {
              type: 'photo',
              externalUrl: SafeParseURL(source, url.origin).href,
            },
          ],
        });
      } catch (e) {
        return Promise.reject(e);
      }
    });

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const KemonoParty = (url) => {
  if (!url.pathname) return Promise.resolve({});

  const postURL = `https://kemono.party${url.pathname}`;

  return fetch(postURL)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((kemonoPartyPage) => {
      /** @type {import("../types/social-post").SocialPost} */
      const socialPost = {
        author: '',
        authorURL: '',
        caption: '',
        postURL: url.href,
        medias: [],
      };

      try {
        const parsedHTML = parseHTML(kemonoPartyPage);
        const filesAnchors = parsedHTML.querySelectorAll('.post__thumbnail > .fileThumb');

        if (!(filesAnchors instanceof Array)) throw new Error('No array with files');

        filesAnchors.slice(1).forEach((fileAnchor) => {
          /** @type {import("../types/social-post").Media} */
          const media = {
            type: 'photo',
          };

          const fullsizeURL = fileAnchor.getAttribute('href');
          if (fullsizeURL) media.original = SafeParseURL(fullsizeURL, url.origin);

          const thumbnailImage = fileAnchor.querySelector('img');
          if (thumbnailImage) media.externalUrl = SafeParseURL(thumbnailImage.getAttribute('src'), url.origin);

          socialPost.medias.push(media);
        });

        const usernameAnchor = parsedHTML.querySelector('.post__user-name');
        if (usernameAnchor) {
          socialPost.author = usernameAnchor.innerText?.trim() || '';
          socialPost.authorURL = SafeParseURL(usernameAnchor.getAttribute('href'), url.origin);
        }

        const postTitleHeader = parsedHTML.querySelector('.post__title');
        if (postTitleHeader) socialPost.caption = postTitleHeader.innerText?.trim() || '';

        return Promise.resolve(socialPost);
      } catch (error) {
        return Promise.reject(error);
      }
    });
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Youtube = (url) => {
  const queries = ParseQuery(url.search);
  const path = ParsePath(url.pathname);

  const brevityDomainId = /youtu\.be/gi.test(url.hostname) && path[0];
  const shortsId = /youtube\.com/gi.test(url.hostname) && path[0] === 'shorts' && path[1];
  const regularId = /youtube\.com/gi.test(url.hostname) && path[0] === 'watch' && queries?.v;

  if (!brevityDomainId && !shortsId && !regularId) {
    LogMessageOrError(`Bad Youtube video link: ${url.href}`);
    return Promise.resolve({});
  }

  const youtubeLink = `https://www.youtube.com/watch?v=${brevityDomainId || shortsId || regularId}`;

  return ytDlpClient
    .execPromise([youtubeLink, '--dump-json'])
    .then(
      (ytDlpPlainOutput) =>
        new Promise((resolve, reject) => {
          try {
            const parsedYtDlp = JSON.parse(ytDlpPlainOutput);
            resolve(parsedYtDlp);
          } catch (e) {
            reject(e);
          }
        })
    )
    .then(
      /** @param {import("../types/yt-dlp").YtDlpOutput} ytDlpOutput */ (ytDlpOutput) => {
        /** @type {import("../types/social-post").SocialPost} */
        const socialPost = {
          author: ytDlpOutput.uploader,
          authorURL: ytDlpOutput.uploader_url,
          caption: ytDlpOutput.title + (ytDlpOutput.description?.length < 50 ? `\n\n${ytDlpOutput.description}` : ''),
          postURL: ytDlpOutput.webpage_url,
          medias: [],
        };

        if (!ytDlpOutput.formats) return Promise.resolve(socialPost);

        const sortedFormats = ytDlpOutput.formats.sort((prev, next) => prev.height - next.height);

        sortedFormats.forEach((format) => {
          if (
            (!format.vcodec || format.vcodec === 'none') &&
            typeof format.acodec === 'string' &&
            format.acodec !== 'none'
          )
            socialPost.medias.push({
              type: 'audio',
              externalUrl: format.url,
              filesize: format.filesize || format.filesize_approx,
              filetype: format.ext,
              description: `${format.format_note} / ${format.acodec.split('.')[0]} (${format.ext}) – audio${
                format.filesize || format.filesize_approx
                  ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
                  : ''
              }`,
            });
          else if (
            (!format.acodec || format.acodec === 'none') &&
            typeof format.vcodec === 'string' &&
            format.vcodec !== 'none'
          )
            socialPost.medias.push({
              type: 'video',
              externalUrl: format.url,
              filesize: format.filesize || format.filesize_approx,
              filetype: format.ext,
              description: `${format.format_note} / ${format.vcodec.split('.')[0]} (${format.ext}) – video${
                format.filesize || format.filesize_approx
                  ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
                  : ''
              }`,
            });
          else if (
            typeof format.acodec === 'string' &&
            format.acodec !== 'none' &&
            typeof format.vcodec === 'string' &&
            format.vcodec !== 'none'
          )
            socialPost.medias.push({
              type: 'video',
              externalUrl: format.url,
              filesize: format.filesize || format.filesize_approx,
              filetype: format.ext,
              description: `${format.format_note} / ${format.vcodec.split('.')[0]} + ${format.acodec.split('.')[0]} (${
                format.ext
              }) – video + audio${
                format.filesize || format.filesize_approx
                  ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
                  : ''
              }`,
            });
        });

        return Promise.resolve(socialPost);
      }
    );
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Osnova = (url) => {
  const siteHostname = url.hostname.replace(/^.*\.(\w+\.\w+)$/, '$1').replace('the.tj', 'tjournal.ru');

  const isUser = /^\/u/i.test(url.pathname);
  const postID = (
    isUser
      ? url.pathname.match(/^\/u\/\d+[\w-]+\/(?<postID>\d+)/)
      : url.pathname.match(/^(?:(?:\/s)?\/[\w-]+)?\/(?<postID>\d+)/)
  )?.groups?.postID;

  if (!postID) return Promise.resolve(null);

  return fetch(`https://api.${siteHostname}/v1.9/entry/${postID}`)
    .then((res) => {
      if (res.ok)
        return res.json().then((response) => {
          /** Osnova API post wrapped in `result` */
          if (response.result) return Promise.resolve(response.result);
          return Promise.reject(new Error('No <result> in Osnova API response'));
        });
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then(
      /** @param {import("../types/osnova-post").OsnovaPost} osnovaPost */ (osnovaPost) => {
        /** @type {import("../types/social-post").SocialPost} */
        const socialPost = {
          author: osnovaPost.author.name,
          authorURL: osnovaPost.author.url,
          caption: osnovaPost.title || '',
          postURL: osnovaPost.url,
          medias: [],
        };

        /** @type {{ waiting: "Twitter" | "Instagram", link: string }[]} */
        const waitingExternalQueue = [];

        /**
         * @param {{ waiting: "Twitter" | "Instagram", link: string }} param0
         * @returns {Promise<import("../types/social-post").Media[]>}
         */
        const LocalLoadExternalBlock = ({ waiting, link }) => {
          if (waiting !== 'Twitter' && waiting !== 'Instagram') return Promise.resolve([]);

          return (waiting === 'Twitter' ? Twitter : Instagram)(SafeParseURL(link))
            .then((externalBlockPost) => {
              /** Block in Osnova post is corrupted */
              if (!(externalBlockPost?.medias instanceof Array)) return Promise.resolve([]);

              return Promise.resolve(externalBlockPost.medias);
            })
            .catch((e) => {
              LogMessageOrError(new Error(`Failed to load block data (${link}) inside Osnova post: ${e}`));
              return Promise.resolve([]);
            });
        };

        osnovaPost.blocks.forEach((block) => {
          if (block.type === 'tweet') {
            waitingExternalQueue.push({
              waiting: 'Twitter',
              // eslint-disable-next-line max-len
              link: `https://twitter.com/${block.data.tweet.data.tweet_data.user.screen_name}/status/${block.data.tweet.data.tweet_data.id_str}`,
            });
            return;
          }

          if (block.type === 'instagram') {
            waitingExternalQueue.push({
              waiting: 'Instagram',
              link: block.data.instagram.data.box_data.url,
            });
            return;
          }

          if (block.type === 'media' && block.data.items)
            block.data.items.forEach((media) => {
              if (!media.image) return;

              const isImage = media.image.data.type !== 'gif';
              const isWebp = media.image.data.type === 'webp';

              socialPost.medias.push({
                type: isImage ? 'photo' : 'video',
                externalUrl: `https://leonardo.osnova.io/${media.image.data.uuid}/${
                  isImage ? `-/preview/1000/${isWebp ? '-/format/jpeg/' : ''}` : '-/format/mp4/'
                }`,
                original: `https://leonardo.osnova.io/${media.image.data.uuid}`,
              });
            });
        });

        if (!waitingExternalQueue.length) return Promise.resolve(socialPost);

        return Promise.all(
          waitingExternalQueue.map((waitingExternalQueueBlock) => LocalLoadExternalBlock(waitingExternalQueueBlock))
        ).then((mediasFromExternalBlocks) => {
          socialPost.medias = socialPost.medias.concat(mediasFromExternalBlocks.flat());
          return Promise.resolve(socialPost);
        });
      }
    );
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Joyreactor = (url) => {
  const JOYREACTOR_DIRECT_HOSTNAME_RX = /^img\d+\./;
  if (JOYREACTOR_DIRECT_HOSTNAME_RX.test(url.hostname))
    return Promise.resolve({
      author: '',
      authorURL: '',
      caption: '',
      postURL: url.href,
      medias: [
        {
          type: /\.gif$/.test(url.pathname) ? 'gif' : 'photo',
          externalUrl: FormViewerURL(url.href, url.origin),
        },
      ],
    });

  const JOYREACTOR_POST_ID_RX = /^\/post\/(?<postID>\d+)/;
  const postID = url.pathname.match(JOYREACTOR_POST_ID_RX)?.groups?.postID;
  if (!postID) return Promise.resolve({});

  url.hostname = url.hostname.replace('m.', '');
  const postGettingUrl = `https://joyreactor.cc/post/${postID}`;

  /**
   * Adds protocol to trimmed URL from HTML, checks whether given URL is valid
   * @param {string} imageLink
   * @returns {string}
   */
  const ReactorPrepareUrl = (imageLink) => {
    if (!imageLink || typeof imageLink !== 'string') return '';

    const preparing = SafeParseURL(imageLink);
    if (!preparing.pathname) return '';
    if (!preparing.protocol) preparing.protocol = 'https';
    return preparing.href;
  };

  return fetch(postGettingUrl, {
    headers: {
      ...DEFAULT_HEADERS,
      referer: 'https://joyreactor.cc/',
      cookie: JOYREACTOR_COOKIE,
    },
  })
    .then((res) => {
      if (!res.ok) return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));

      return res.text();
    })
    .then((joyreactorPage) => {
      try {
        const parsedHTML = parseHTML(joyreactorPage);

        const postContent = parsedHTML.querySelector('.post_content');
        if (!postContent) throw new Error('No <postContent> in <joyreactorPage>');

        const imageWrappers = postContent.querySelectorAll('.image');
        if (!imageWrappers?.length) return Promise.resolve({});

        const authorAnchor = parsedHTML.getElementById('contentinner')?.querySelector('.uhead_nick a');
        const author = authorAnchor?.innerText || '';
        const authorURL = authorAnchor?.getAttribute('href')
          ? SafeParseURL(authorAnchor.getAttribute('href'), postGettingUrl)
          : '';
        const postTitle = parsedHTML.querySelector('.post_content > div:first-child > h3')?.innerText;
        const firstTag = (parsedHTML.querySelector('.post_description')?.innerText || '').split(':')[0]?.trim();

        /** @type {import("../types/social-post").SocialPost} */
        const socialPost = {
          author,
          authorURL,
          caption: postTitle || firstTag || '',
          postURL: postGettingUrl,
          medias: imageWrappers
            .map((imageWrapper) => {
              /** @type {import("../types/social-post").Media} */
              const media = {};

              const videoHolder =
                imageWrapper.querySelector('.video_holder') || imageWrapper.querySelector('.video_gif_holder');

              if (videoHolder) {
                const videoElem = imageWrapper.querySelector('video');
                if (!videoElem) return null;

                /** Telegram sometimes cannot send .webm videos and gifs from .webm. If so, set to mp4 */
                const matchingType = 'mp4';
                media.type =
                  videoElem.hasAttribute('muted') || videoHolder.classList.contains('video_gif_holder')
                    ? 'gif'
                    : 'video';

                const properSources = videoElem
                  .querySelectorAll('source')
                  .map((sourceElem) => ({
                    url: sourceElem.getAttribute('src'),
                    mimeType: sourceElem.getAttribute('type'),
                  }))
                  .filter((source) => !!source.url && new RegExp(`${matchingType}$`, 'i').test(source.mimeType));

                const availableSource = ReactorPrepareUrl(properSources.pop()?.url);
                if (availableSource) {
                  media.filetype = matchingType;
                  media.externalUrl = FormViewerURL(availableSource, SafeParseURL(availableSource).origin);
                  media.original = media.externalUrl;
                }

                if (videoHolder.classList.contains('video_gif_holder')) {
                  const originalGifURL = ReactorPrepareUrl(
                    videoHolder.querySelector('.video_gif_source')?.getAttribute('href')
                  );

                  if (originalGifURL)
                    media.original = FormViewerURL(originalGifURL, SafeParseURL(originalGifURL).origin);
                  if (!media.externalUrl && media.original) media.externalUrl = media.original;
                }
              } else {
                const fullAnchor = imageWrapper.querySelector('a');
                const defaultImageElem = imageWrapper.querySelector('img');

                const defaultImage = ReactorPrepareUrl(defaultImageElem?.getAttribute('src'));
                if (!defaultImage) return null;

                media.type = 'photo';
                media.externalUrl = FormViewerURL(defaultImage, SafeParseURL(defaultImage).origin);

                const full = ReactorPrepareUrl(fullAnchor?.getAttribute('href'));
                const extension = (full || defaultImage).match(/\.(?<extension>\w+)$/i)?.groups?.extension;
                media.filetype = extension;

                if (full) media.original = FormViewerURL(full, SafeParseURL(full).origin);
              }

              return media;
            })
            .filter(Boolean),
        };

        return Promise.resolve(socialPost);
      } catch (e) {
        return Promise.reject(e);
      }
    });
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Coub = (url) => {
  const COUB_VIDEO_RX = /^\/view\/(?<videoID>\w+)/;
  const videoID = url.pathname.match(COUB_VIDEO_RX)?.groups?.videoID;
  if (!videoID) return Promise.resolve({});

  const postURL = `https://coub.com/view/${videoID}`;

  return fetch(postURL, {
    headers: {
      ...DEFAULT_HEADERS,
      referer: 'https://coub.com/',
    },
  })
    .then((res) => {
      if (!res.ok) return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));

      return res.text();
    })
    .then((coubPage) => {
      try {
        const parsedHTML = parseHTML(coubPage);

        const coubPageCoubJson = parsedHTML.getElementById('coubPageCoubJson');
        if (!coubPageCoubJson) throw new Error('No <coubPageCoubJson> in <coubPage>');

        /** @type {import('../types/coub-post').CoubPost} */
        const post = JSON.parse(coubPageCoubJson.innerHTML.trim());

        if (!post.file_versions) return Promise.reject(new Error(`Coub ${postURL} does not have <file_versions>`));

        /** @type {import('../types/social-post').SocialPost} */
        const socialPost = {
          author: post.channel.title,
          authorURL: `https://coub.com/${post.channel.permalink}`,
          caption: post.title,
          postURL,
          medias: [],
        };

        let videoToMerge = '';
        let audioToMerge = '';

        if (post.file_versions.html5) {
          /** @type {import('../types/coub-post').QualityOption[]} */
          const videoQualities = Object.values(post.file_versions.html5.video) || [];
          /** @type {import('../types/coub-post').QualityOption[]} */
          const audioQualities = Object.values(post.file_versions.html5.audio) || [];

          videoToMerge = videoQualities.sort((prev, next) => next.size - prev.size).shift()?.url;
          audioToMerge = audioQualities.sort((prev, next) => next.size - prev.size).shift()?.url;
        } else if (post.file_versions.mobile) {
          videoToMerge = post.file_versions.mobile.video;
          audioToMerge = post.file_versions.mobile.audio.pop();
        } else videoToMerge = post.file_versions.share?.default;

        return VideoAudioMerge(videoToMerge, audioToMerge, { loopVideo: true })
          .catch(() => Promise.resolve({ externalUrl: videoToMerge }))
          .then((videoAudioMerged) => {
            if ('externalUrl' in videoAudioMerged)
              socialPost.medias.push({
                externalUrl: videoAudioMerged.externalUrl,
                type: 'video',
              });
            else if ('filename' in videoAudioMerged)
              socialPost.medias.push({
                type: 'video',
                otherSources: {
                  audioSource: videoAudioMerged.audioSource,
                  videoSource: videoAudioMerged.videoSource,
                },
                filename: videoAudioMerged.filename,
                filetype: SafeParseURL(videoAudioMerged.videoSource).pathname.split('.').pop(),
                fileCallback: videoAudioMerged.fileCallback,
              });

            return Promise.resolve(socialPost);
          });
      } catch (e) {
        return Promise.reject(e);
      }
    });
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const Tiktok = (url) => {
  const isShortened = url.hostname !== 'tiktok.com' && url.hostname !== 'www.tiktok.com';
  const pathParts = url.pathname.split('/').filter(Boolean);

  if ((isShortened && pathParts.length !== 1) || (!isShortened && (pathParts[1] !== 'video' || !pathParts[2]))) {
    LogMessageOrError(`Bad Tiktok video link: ${url.href}`);
    return Promise.resolve({});
  }

  return ytDlpClient
    .execPromise([url.href, '--dump-json'])
    .then(
      (ytDlpPlainOutput) =>
        new Promise((resolve, reject) => {
          try {
            const parsedYtDlp = JSON.parse(ytDlpPlainOutput);
            resolve(parsedYtDlp);
          } catch (e) {
            reject(e);
          }
        })
    )
    .then(
      /** @param {import("../types/yt-dlp").YtDlpOutput} ytDlpOutput */ (ytDlpOutput) => {
        /** @type {import("../types/social-post").SocialPost} */
        const socialPost = {
          author: ytDlpOutput.uploader,
          authorURL: ytDlpOutput.uploader_url,
          caption: ytDlpOutput.title + (ytDlpOutput.description?.length < 50 ? `\n\n${ytDlpOutput.description}` : ''),
          postURL: ytDlpOutput.webpage_url,
          medias: [],
        };

        const isPhotoCardsPost = !ytDlpOutput.formats.some((format) => format.filesize);
        if (isPhotoCardsPost) return Promise.resolve(socialPost);

        const formatsWithBothVideoAudio = ytDlpOutput.formats.filter(
          (format) =>
            typeof format.vcodec === 'string' &&
            format.vcodec !== 'none' &&
            typeof format.acodec === 'string' &&
            format.acodec !== 'none' &&
            !/\.mp3$/.test(format.url)
        );
        const formatsUniqueBySize = formatsWithBothVideoAudio.filter(
          (format, index, array) =>
            index ===
            array.findIndex((comparing) => {
              if ('filesize' in comparing || 'filesize' in format) return comparing.filesize === format.filesize;

              return comparing.filesize_approx === format.filesize_approx;
            })
        );
        const biggestH265Format = formatsUniqueBySize
          .filter((format) => format.vcodec === 'h265')
          .sort((prev, next) => (prev.filesize || prev.filesize_approx) - (next.filesize || next.filesize_approx))
          .pop();
        const formatToConvert = formatsWithBothVideoAudio
          .filter(
            (format) =>
              format.vcodec === 'h265' &&
              format.filesize === biggestH265Format.filesize &&
              format.format_id !== biggestH265Format.format_id
          )
          .pop();
        const legacyH264Formats = formatsUniqueBySize.filter((format) => format.vcodec === 'h264');
        const formatsToSend = legacyH264Formats.concat(biggestH265Format).filter(Boolean);

        formatsToSend.forEach((format) => {
          socialPost.medias.push({
            type: 'video',
            externalUrl: format.url,
            filesize: format.filesize || format.filesize_approx,
            filetype: format.ext,
            description: `${
              format.width || format.format_id?.match(/^[^_]+_(?<width>\d+)/)?.groups?.width || '720'
            }p / ${format.vcodec.split('.')[0]} + ${format.acodec.split('.')[0]} (${format.ext}) – video + audio${
              format.filesize || format.filesize_approx
                ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
                : ''
            }${/watermark/i.test(format.format_note) ? ' / Watermarked' : ''}`,
          });
        });

        if (legacyH264Formats.length) return Promise.resolve(socialPost);
        if (!formatToConvert?.url) return Promise.resolve({});

        const convertToExtension = 'mp4';
        const convertToVideoCodec = 'h264';
        const convertToAudioCodec = 'aac';
        return VideoCodecConvert(formatToConvert.url, convertToExtension, convertToVideoCodec, convertToAudioCodec)
          .then((convertedVideo) => {
            if ('externalUrl' in convertedVideo) return Promise.resolve(socialPost);

            socialPost.medias.push({
              type: 'video',
              otherSources: {
                videoSource: formatToConvert.url,
              },
              filename: convertedVideo.filename,
              filetype: formatToConvert.ext,
              fileCallback: convertedVideo.fileCallback,
              description: `${
                formatToConvert.width ||
                formatToConvert.format_id?.match(/^[^_]+_(?<width>\d+)/)?.groups?.width ||
                '720'
              }p / ${convertToVideoCodec} + ${convertToAudioCodec} (${convertToExtension}) – video + audio${
                convertedVideo.filesize ? ` / ${HumanReadableSize(convertedVideo.filesize)}` : ''
              } / Converted`,
            });

            return Promise.resolve(socialPost);
          })
          .catch(() => Promise.resolve(socialPost));
      }
    );
};

const ALL_PARSERS = {
  AnimePictures,
  Danbooru,
  Eshuushuu,
  Gelbooru,
  Instagram,
  Konachan,
  Pixiv,
  PixivDirect,
  Reddit,
  Sankaku,
  Tumblr,
  Twitter,
  TwitterDirect,
  Yandere,
  Zerochan,
  KemonoParty,
  Youtube,
  Osnova,
  Joyreactor,
  Coub,
  Tiktok,
};

/** @typedef {keyof ALL_PARSERS} PlatformEnum */
/**
 * @param {PlatformEnum} platform
 * @param {URL} url
 * @returns {Promise<import("../types/social-post").SocialPost>}
 */
const SocialParser = (platform, url) => {
  const platformParser = ALL_PARSERS[platform];
  if (!platformParser || !url) return Promise.resolve({});

  return platformParser(url);
};

export default SocialParser;
