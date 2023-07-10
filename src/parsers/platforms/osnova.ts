import fetch from 'node-fetch';
import { OsnovaPost } from '../../types/osnova-post.js';
import { Media, SocialPost } from '../../types/social-post.js';
import Twitter from './twitter.js';
import Instagram from './instagram.js';
import { SafeParseURL } from '../../util/urls.js';
import LogMessageOrError from '../../util/log.js';

export default function Osnova(url: URL): Promise<SocialPost | undefined> {
  const siteHostname = url.hostname.replace(/^.*\.(\w+\.\w+)$/, '$1').replace('the.tj', 'tjournal.ru');

  const isUser = /^\/u/i.test(url.pathname);
  const postID = (
    isUser
      ? url.pathname.match(/^\/u\/\d+[\w-]+\/(?<postID>\d+)/)
      : url.pathname.match(/^(?:(?:\/s)?\/[\w-]+)?\/(?<postID>\d+)/)
  )?.groups?.postID;

  if (!postID) return Promise.resolve(undefined);

  return fetch(`https://api.${siteHostname}/v2.31/content?id=${postID}`)
    .then((res) => {
      if (res.ok)
        /** Osnova API post wrapped in `result` */
        return (res.json() as Promise<{ result: OsnovaPost }>).then((response) => {
          if (response.result) return Promise.resolve(response.result);
          return Promise.reject(new Error('No <result> in Osnova API response'));
        });
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((osnovaPost) => {
      const socialPost: SocialPost = {
        author: osnovaPost.author.name,
        authorURL: `https://${siteHostname}/u/${osnovaPost.author.id}`,
        caption: osnovaPost.title || '',
        postURL: osnovaPost.url,
        medias: [],
      };

      const waitingExternalQueue: { waiting: 'Twitter' | 'Instagram'; link: string }[] = [];

      const LocalLoadExternalBlock = ({
        waiting,
        link,
      }: {
        waiting: 'Twitter' | 'Instagram';
        link: string;
      }): Promise<Media[]> => {
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
    });
}
