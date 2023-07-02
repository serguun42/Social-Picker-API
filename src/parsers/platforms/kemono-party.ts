import { parse as parseHTML } from 'node-html-parser';
import fetch from 'node-fetch';
import { Media, SocialPost } from '../../types/social-post.js';
import { SafeParseURL } from '../../util/urls.js';

export default function KemonoParty(url: URL): Promise<SocialPost | undefined> {
  if (!url.pathname) return Promise.resolve(undefined);

  const postURL = `https://kemono.party${url.pathname}`;

  return fetch(postURL)
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
        const filesAnchors = parsedHTML.querySelectorAll('.post__thumbnail > .fileThumb');

        if (!(filesAnchors instanceof Array)) throw new Error('No array with files');

        filesAnchors.slice(1).forEach((fileAnchor) => {
          const media: Media = {
            type: 'photo',
          };

          const fullsizeURL = fileAnchor.getAttribute('href');
          if (fullsizeURL) media.original = SafeParseURL(fullsizeURL, url.origin).href;

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
