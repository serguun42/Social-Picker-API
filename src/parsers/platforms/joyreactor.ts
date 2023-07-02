import { parse as parseHTML } from 'node-html-parser';
import fetch from 'node-fetch';
import { Media, SocialPost } from '../../types/social-post.js';
import FormViewerURL from '../../util/form-viewer-url.js';
import { SafeParseURL } from '../../util/urls.js';
import DEFAULT_HEADERS from '../default-headers.js';
import LoadConfig from '../../util/load-configs.js';

const { JOYREACTOR_COOKIE } = LoadConfig('tokens');

export default function Joyreactor(url: URL): Promise<SocialPost | undefined> {
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
  if (!postID) return Promise.resolve(undefined);

  url.hostname = url.hostname.replace('m.', '');
  const postGettingUrl = `https://joyreactor.cc/post/${postID}`;

  /**
   * Adds protocol to trimmed URL from HTML, checks whether given URL is valid
   */
  const ReactorPrepareUrl = (imageLink: string | undefined): string => {
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
        if (!imageWrappers?.length) return Promise.resolve(undefined);

        const authorAnchor = parsedHTML.getElementById('contentinner')?.querySelector('.uhead_nick a');
        const author = authorAnchor?.innerText || '';
        const authorURL = authorAnchor?.getAttribute('href')
          ? SafeParseURL(authorAnchor.getAttribute('href'), postGettingUrl).href
          : '';
        const postTitle = parsedHTML.querySelector('.post_content > div:first-child > h3')?.innerText;
        const firstTag = (parsedHTML.querySelector('.post_description')?.innerText || '').split(':')[0]?.trim();

        const socialPost: SocialPost = {
          author,
          authorURL,
          caption: postTitle || firstTag || '',
          postURL: postGettingUrl,
          medias: imageWrappers
            .map((imageWrapper) => {
              const media: Media = {
                type: 'photo',
              };

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
                  .filter((source) => !!source.url && new RegExp(`${matchingType}$`, 'i').test(source.mimeType || ''));

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
            .filter((media): media is Media => !!media),
        };

        return Promise.resolve(socialPost);
      } catch (e) {
        return Promise.reject(e);
      }
    });
}
