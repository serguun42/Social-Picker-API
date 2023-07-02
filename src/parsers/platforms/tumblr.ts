import TumblrJs from 'tumblr.js';
import LoadConfig from '../../util/load-configs.js';
import { Media, SocialPost } from '../../types/social-post.js';
import { Medium, TumblrPost } from '../../types/tumblr.js';

const { TUMBLR_OAUTH } = LoadConfig('tokens');

const TumblrClient = TumblrJs.createClient({
  credentials: TUMBLR_OAUTH,
  returnPromises: true,
});

export default function Tumblr(url: URL): Promise<SocialPost | undefined> {
  const MAIN_DOMAIN_RX = /^\/(?<blogID>[^/]+)\/(?<postID>\d+)/i;
  const API_PATH_BASE = '/v2/blog/__BLOG_ID__/posts/__POST_ID__';

  const isSubdomain = /^\/posts?\//i.test(url.pathname);
  const blogID = isSubdomain
    ? url.hostname.replace(/\.tumblr\.(com|co\.\w+|org)$/i, '')
    : url.pathname.match(MAIN_DOMAIN_RX)?.groups?.blogID;
  const postID = isSubdomain
    ? url.pathname.match(/^\/posts?\/(?<postID>\d+)/i)?.groups?.postID
    : url.pathname.match(MAIN_DOMAIN_RX)?.groups?.postID;

  if (!blogID || !postID) return Promise.resolve(undefined);

  const fetchingAPIPath = API_PATH_BASE.replace(/__BLOG_ID__/g, blogID).replace(/__POST_ID__/g, postID);

  if (!('getRequest' in TumblrClient)) return Promise.resolve(undefined);
  return (TumblrClient.getRequest as (apiPath: string, params: Record<string, unknown>) => Promise<TumblrPost>)(
    fetchingAPIPath,
    {}
  ).then((tumblr) => {
    const content = tumblr.content?.length ? tumblr.content : tumblr.trail?.[0]?.content;
    if (!content) return Promise.reject(new Error(`No content in tumblr: ${url.pathname}`));

    const medias: Media[] = content
      .filter((block) => block.type === 'image')
      .map((imageBlock): Medium | null => {
        if (!imageBlock.media) return null;

        return imageBlock.media.sort((prev, next) => next.width - prev.width)?.[0];
      })
      .filter((media): media is Medium => !!media)
      .map((image) => ({
        type: /\.gif$/i.test(image.url) ? 'gif' : 'photo',
        externalUrl: image.url,
      }));

    if (!medias?.length) return Promise.reject(new Error(`No medias in tumblr: ${url.pathname}`));

    const caption = content
      .filter((block) => block.type === 'text')
      .map((text) => text?.text || '')
      .join('\n\n');

    const socialPost: SocialPost = {
      author: blogID,
      authorURL: `https://${blogID}.tumblr.com`,
      caption: caption || '',
      medias,
      postURL: `https://${blogID}.tumblr.com/post/${postID}`,
    };

    return Promise.resolve(socialPost);
  });
}
