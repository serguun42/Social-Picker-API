import { SocialPost } from '../../types/social-post.js';
import LogMessageOrError from '../../util/log.js';
import { SafeParseURL } from '../../util/urls.js';
import Pixiv from './pixiv.js';

export default function PixivDirect(url: URL): Promise<SocialPost | undefined> {
  const PIXIV_IMAGE_RX = /\/(?<illustId>\d+)_p(?<imageIndex>\d+)(?:_\w+)?\.\w+$/;
  const imageMatchGroups = url.pathname.match(PIXIV_IMAGE_RX)?.groups || {};

  if (!Object.keys(imageMatchGroups).length) {
    LogMessageOrError(new Error(`Bad Pixiv image url: ${url.href}`));
    return Promise.resolve(undefined);
  }

  const { illustId, imageIndex } = imageMatchGroups;
  if (!illustId || typeof parseInt(imageIndex) !== 'number') {
    LogMessageOrError(new Error(`Bad Pixiv image url: ${url.href}`));
    return Promise.resolve(undefined);
  }

  const pixivUrl = SafeParseURL(`https://www.pixiv.net/en/artworks/${illustId}`);
  return Pixiv(pixivUrl, parseInt(imageIndex));
}
