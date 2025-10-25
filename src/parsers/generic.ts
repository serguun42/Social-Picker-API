import { SocialPost } from '../types/social-post.js';
import Coub from './platforms/coub.js';
import Instagram from './platforms/instagram.js';
import Joyreactor from './platforms/joyreactor.js';
import Kemono from './platforms/kemono.js';
import Osnova from './platforms/osnova.js';
import PixivDirect from './platforms/pixiv-direct.js';
import Pixiv from './platforms/pixiv.js';
import Reddit from './platforms/reddit.js';
import Tiktok from './platforms/tiktok.js';
import Tumblr from './platforms/tumblr.js';
import TwitterDirect from './platforms/twitter-direct.js';
import Twitter from './platforms/twitter.js';
import {
  AnimePictures,
  Danbooru,
  Eshuushuu,
  Gelbooru,
  Konachan,
  Sankaku,
  Yandere,
  Zerochan,
} from './platforms/unstable.js';
import Youtube from './platforms/youtube.js';

const ALL_PARSERS = {
  Twitter,
  TwitterDirect,
  Pixiv,
  PixivDirect,
  Reddit,
  Youtube,
  Tiktok,
  Instagram,
  Osnova,
  Coub,
  Joyreactor,
  Tumblr,
  Kemono,
  Danbooru,
  Gelbooru,
  Konachan,
  Yandere,
  Eshuushuu,
  Sankaku,
  Zerochan,
  AnimePictures,
};

export type PlatformEnum = keyof typeof ALL_PARSERS;

export default function GenericSocialParser(platform: PlatformEnum, url: URL): Promise<SocialPost | undefined> {
  const platformParser = ALL_PARSERS[platform];
  if (!platformParser || !url) return Promise.resolve(undefined);

  return platformParser(url);
}
