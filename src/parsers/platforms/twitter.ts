import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { GalleryDLTwitterMediaType } from '../../types/gallery-dl.js';
import { Media, SocialPost } from '../../types/social-post.js';
import loadConfig from '../../util/load-configs.js';
import galleryDL from '../common/gallery-dl.js';

const { TWITTER_COOKIE_FILE_LOCATION } = loadConfig('tokens');

export default function Twitter(url: URL): Promise<SocialPost | undefined> {
  if (!TWITTER_COOKIE_FILE_LOCATION) return Promise.resolve(undefined);

  const groups = url.pathname.match(/^(?<username>\/[\w_]+)\/status(?:es)?\/(?<statusID>\d+)/)?.groups;
  const { statusID, username } = groups || {};

  if (!statusID || !username) return Promise.resolve(undefined);

  const postURL = `https://x.com${url.pathname}`;

  return stat(resolve(TWITTER_COOKIE_FILE_LOCATION))
    .then((stats) => {
      if (!stats.isFile()) return Promise.reject(new Error(`${TWITTER_COOKIE_FILE_LOCATION} is not a file`));

      return galleryDL<'twitter'>(postURL, resolve(TWITTER_COOKIE_FILE_LOCATION));
    })
    .then((parsedPost) => {
      if (!Array.isArray(parsedPost)) return Promise.reject(new Error("gallery-dl didn't return an array"));

      const socialPost: SocialPost = {
        author:
          parsedPost
            .map((item) =>
              item[0] === 2 ? item[1]?.author?.nick?.trim() : item[0] === 3 ? item[2]?.author?.nick?.trim() : undefined
            )
            .find((authorNick) => typeof authorNick === 'string' && !!authorNick) || '',
        authorURL: `https://x.com/${username}`,
        caption:
          parsedPost
            .map((item) => (item[0] === 2 ? item[1]?.content?.trim() : undefined))
            .find((content) => !!content?.trim()) || '',
        postURL,
        medias: parsedPost
          .filter((item) => item[0] === 3)
          .filter(
            (item) =>
              typeof item[1] === 'string' &&
              (['animated_gif', 'photo', 'video'] satisfies GalleryDLTwitterMediaType[]).includes(item[2]?.type)
          )
          .map(
            (item): Media => ({
              type: item[2].type === 'animated_gif' ? 'gif' : item[2].type === 'video' ? 'video' : 'photo',
              externalUrl: item[1],
              original: item[1],
            })
          )
          .filter(Boolean),
      };

      return socialPost;
    });
}
