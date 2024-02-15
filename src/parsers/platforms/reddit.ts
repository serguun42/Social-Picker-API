import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import RedditPost from '../../types/reddit-post.js';
import { Media, SocialPost } from '../../types/social-post.js';
import FormViewerURL from '../../util/form-viewer-url.js';
import LoadConfig from '../../util/load-configs.js';
import { SafeParseURL } from '../../util/urls.js';
import VideoAudioMerge from '../../util/video-audio-merge.js';
import DEFAULT_HEADERS from '../default-headers.js';

const { PROXY_HOSTNAME, PROXY_PORT } = LoadConfig('service');
const PROXY_AGENT =
  PROXY_HOSTNAME && PROXY_PORT ? new SocksProxyAgent(`socks5://${PROXY_HOSTNAME}:${PROXY_PORT}`) : undefined;

const { REDDIT_COOKIE } = LoadConfig('tokens');

export default function Reddit(url: URL): Promise<SocialPost | undefined> {
  if (!url.pathname) return Promise.resolve(undefined);

  const REDDIT_POST_REGEXP =
    /^(?<givenPathname>(?:\/r\/[\w-._]+)?\/(?<pathnameCommentsFormat>comments|s)\/[\w-.]+)(?:\/)?/i;
  const REDDIT_HEADERS = {
    ...DEFAULT_HEADERS,
    referer: 'https://www.reddit.com/',
  };

  const match = (url.hostname === 'redd.it' ? `/comments${url.pathname}` : url.pathname).match(REDDIT_POST_REGEXP);
  const { givenPathname, pathnameCommentsFormat } = match?.groups || {};
  if (!givenPathname) return Promise.resolve(undefined);

  const postURL = SafeParseURL(givenPathname, 'https://www.reddit.com').href;

  if (pathnameCommentsFormat === 's') {
    return fetch(postURL, { headers: REDDIT_HEADERS, redirect: 'manual' }).then((res) => {
      const targetLocation = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && targetLocation) {
        const targetURL = SafeParseURL(targetLocation);
        targetURL.search = '';

        if (/\breddit\.com$/i.test(targetURL.hostname)) return Reddit(targetURL);
      }

      return Promise.reject(
        new Error(
          [
            'Reddit new comments URL format: no redirect to actual post.',
            `Status code ${res.status} ${res.statusText} (${res.url})`,
          ].join(' ')
        )
      );
    });
  }

  return fetch(`${postURL}.json`, { headers: { ...REDDIT_HEADERS, cookie: REDDIT_COOKIE }, agent: PROXY_AGENT })
    .then((res) => {
      if (res.ok) return res.json() as Promise<RedditPost>;
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((redditPostJSON) => {
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

      const socialPost: SocialPost = { author, authorURL, postURL, caption, medias: [] };

      if (crossPostParent && typeof crossPostParent === 'string') {
        const parentId = crossPostParent.split('_')[1];
        if (!parentId) return Promise.resolve(undefined);

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
          const videoSources: Media[] = [];

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

          socialPost.medias = videoSources;

          return Promise.resolve(socialPost);
        });
      }

      if (isGallery) {
        socialPost.medias = (post.gallery_data?.items || [])
          .map((item): Media | null => {
            const source = post.media_metadata?.[item.media_id]?.s;
            if (!source) return null;

            if ('gif' in source)
              return {
                type: 'gif',
                externalUrl: source.gif as string,
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
          })
          .filter((media): media is Media => !!media);

        return Promise.resolve(socialPost);
      }

      const previewMedia: Media[] = (post.preview?.images || [])
        .map((image): Media | null => {
          if (!image?.variants) return null;

          const isGifByPresentVariant = image.variants.gif?.source?.url;
          const videoUrl = (image.variants.mp4?.source?.url || '').replace(/&amp;/g, '&');

          if (!videoUrl) return null;

          return {
            type: isGifByPresentVariant ? 'gif' : 'video',
            externalUrl: videoUrl,
            filetype: 'mp4',
          };
        })
        .filter((media): media is Media => !!media);

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
    });
}
