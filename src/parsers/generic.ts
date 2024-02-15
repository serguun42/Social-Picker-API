import { SocialPost } from '../types/social-post.js';
import Twitter from './platforms/twitter.js';
import TwitterDirect from './platforms/twitter-direct.js';
import Pixiv from './platforms/pixiv.js';
import PixivDirect from './platforms/pixiv-direct.js';
import Reddit from './platforms/reddit.js';
import Youtube from './platforms/youtube.js';
import Tiktok from './platforms/tiktok.js';
import Instagram from './platforms/instagram.js';
import Osnova from './platforms/osnova.js';
import Coub from './platforms/coub.js';
import Joyreactor from './platforms/joyreactor.js';
import Tumblr from './platforms/tumblr.js';
import Kemono from './platforms/kemono.js';
import {
  Danbooru,
  Gelbooru,
  Konachan,
  Yandere,
  Eshuushuu,
  Sankaku,
  Zerochan,
  AnimePictures,
} from './platforms/unstable.js';

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
