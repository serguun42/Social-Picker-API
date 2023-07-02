import { parse as parseHTML } from 'node-html-parser';
import fetch from 'node-fetch';
import { SocialPost } from '../../types/social-post.js';
import { SafeParseURL } from '../../util/urls.js';

export function Danbooru(url: URL): Promise<SocialPost | undefined> {
  if (!/^\/posts\/\d+/.test(url.pathname)) return Promise.resolve(undefined);

  return fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((danbooruPage) => {
      const socialPost: SocialPost = {
        author: '',
        authorURL: '',
        caption: '',
        postURL: url.href,
        medias: [],
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
          socialPost.authorURL = SafeParseURL(uploaderAnchor.getAttribute('href') || '', url.origin).href;
        }

        return Promise.resolve(socialPost);
      } catch (e) {
        return Promise.reject(e);
      }
    });
}

export function Gelbooru(url: URL): Promise<SocialPost | undefined> {
  return fetch(url.href)
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
}

export function Konachan(url: URL): Promise<SocialPost | undefined> {
  return fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((konachanPage) => {
      let source = '';

      try {
        source =
          konachanPage.split('<body')[1].match(
            // eslint-disable-next-line max-len
            /<a(\s+[\w-]+="([^"]+)")*\s+href="([^"]+)"(\s+[\w-]+="([^"]+)")*\s+id="highres"(\s+[\w-]+="([^"]+)")*/i
          )?.[3] || '';
      } catch (e) {
        return Promise.reject(new Error(`Error on parsing Konachan (${url.href})`));
      }

      if (!source) return Promise.reject(new Error(`No Konachan source (${url.href})`));

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
}

export function Yandere(url: URL): Promise<SocialPost | undefined> {
  return fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((yanderePage) => {
      let source = '';

      try {
        source = yanderePage.split('<body')[1].match(/<a\s+class="[^"]+"\s+id="highres"\s+href="([^"]+)"/i)?.[1] || '';
      } catch (e) {
        return Promise.reject(new Error(`Error on parsing Yandere (${url.href})`));
      }

      if (!source) return Promise.reject(new Error(`No Yandere source (${url.href})`));

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
}

export function Eshuushuu(url: URL): Promise<SocialPost | undefined> {
  return fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((eshuushuuPage) => {
      let source = '';

      try {
        const match = eshuushuuPage.split('<body')[1].match(/<a\s+class="thumb_image"\s+href="([^"]+)"/i);

        if (match?.[1]) source = `https://e-shuushuu.net/${match[1].replace(/\/\//g, '/').replace(/^\//g, '')}`;
      } catch (e) {
        return Promise.reject(new Error(`Error on parsing Eshuushuu (${url.href})`));
      }

      if (!source) return Promise.reject(new Error(`No Eshuushuu source (${url.href})`));

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
}

export function Sankaku(url: URL): Promise<SocialPost | undefined> {
  return fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((sankakuPage) => {
      let source = '';

      try {
        const match = sankakuPage.split('<body')[1].match(/<a\s+href="([^"]+)"\s+id=(")?highres/i);
        if (match?.[1]) source = match[1].replace(/&amp;/g, '&');
      } catch (e) {
        return Promise.reject(new Error(`Error on parsing Sankaku (${url.href})`));
      }

      if (!source) return Promise.reject(new Error(`No Sankaku source (${url.href})`));
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
}

export function Zerochan(url: URL): Promise<SocialPost | undefined> {
  return fetch(url.href)
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((zerochanPage) => {
      let source = '';

      try {
        source =
          zerochanPage.split('</head')[0].match(/<meta\s+(name|property)="og:image"\s+content="([^"]+)"/i)?.[2] || '';

        if (!source) {
          source =
            zerochanPage
              .split('</head')[0]
              .match(/<meta\s+(name|property)="twitter:image"\s+content="([^"]+)"/i)?.[2] || '';
        }
      } catch (e) {
        return Promise.reject(new Error(`Error on parsing Zerochan (${url.href})`));
      }

      if (!source) return Promise.reject(new Error(`No Zerochan source (${url.href})`));

      const sourceBasename = source.replace(/\.\w+$/, '');
      const basenameMatch = zerochanPage.match(new RegExp(`${sourceBasename}.[\\w\\d]+`, 'gi'));

      if (basenameMatch && basenameMatch.pop) source = basenameMatch.pop() || '';

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
}

export function AnimePictures(url: URL): Promise<SocialPost | undefined> {
  return fetch(url.href)
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
}
