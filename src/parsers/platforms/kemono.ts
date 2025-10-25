import fetch from 'node-fetch';
import { parse as parseHTML } from 'node-html-parser';

import { Media, SocialPost } from '../../types/social-post.js';
import { SafeParseURL } from '../../util/links/urls.js';
import loadConfig from '../../util/load-configs.js';
import PROXY_AGENT from '../../util/proxy.js';
import DEFAULT_HEADERS from '../default-headers.js';

const { KEMONO_COOKIE } = loadConfig('tokens');

export default function Kemono(url: URL): Promise<SocialPost | undefined> {
  if (!url.pathname) return Promise.resolve(undefined);

  const postURL = new URL(url.pathname, 'https://kemono.su/').href;

  return fetch(postURL, {
    headers: {
      ...DEFAULT_HEADERS,
      referer: 'https://kemono.su/',
      ...(KEMONO_COOKIE ? { cookie: KEMONO_COOKIE } : {}),
    },
    agent: PROXY_AGENT,
  })
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((kemonoPartyPage) => {
      const socialPost: SocialPost = {
        author: '',
        authorURL: '',
        caption: '',
        postURL: url.href,
        medias: [],
      };

      try {
        const parsedHTML = parseHTML(kemonoPartyPage);
        const filesAnchors = parsedHTML.querySelectorAll('.post__thumbnail .fileThumb');

        if (!(filesAnchors instanceof Array)) throw new Error('No array with files');

        filesAnchors.forEach((fileAnchor) => {
          const media: Media = {
            type: 'photo',
          };

          const fullSizeURL = fileAnchor.getAttribute('href');
          if (fullSizeURL) media.original = SafeParseURL(fullSizeURL, url.origin).href;

          const thumbnailImage = fileAnchor.querySelector('img');
          if (thumbnailImage) media.externalUrl = SafeParseURL(thumbnailImage.getAttribute('src'), url.origin).href;

          socialPost.medias.push(media);
        });

        const usernameAnchor = parsedHTML.querySelector('.post__user-name');
        if (usernameAnchor) {
          socialPost.author = usernameAnchor.innerText?.trim() || '';
          socialPost.authorURL = SafeParseURL(usernameAnchor.getAttribute('href'), url.origin).href;
        }

        const postTitleHeader = parsedHTML.querySelector('.post__title');
        if (postTitleHeader) socialPost.caption = postTitleHeader.innerText?.trim() || '';

        return Promise.resolve(socialPost);
      } catch (error) {
        return Promise.reject(error);
      }
    });
}
