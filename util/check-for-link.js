import { SafeParseURL } from './urls.js';

/**
 * @param {string} givenURL
 * @returns {{ status: boolean, platform: string, url: URL }}
 */
const CheckForLink = (givenURL) => {
  const url = SafeParseURL(givenURL);

  if (
    url.hostname === 'twitter.com' ||
    url.hostname === 'www.twitter.com' ||
    url.hostname === 'mobile.twitter.com' ||
    url.hostname === 'nitter.net' ||
    url.hostname === 'www.nitter.net' ||
    url.hostname === 'mobile.nitter.net'
  )
    return { status: true, platform: 'Twitter', url };
  if (url.hostname === 'pbs.twimg.com' || url.hostname === 'video.twimg.com')
    return { status: true, platform: 'TwitterDirect', url };
  if (url.hostname === 'instagram.com' || url.hostname === 'www.instagram.com')
    return { status: true, platform: 'Instagram', url };
  if (
    url.hostname === 'reddit.com' ||
    url.hostname === 'www.reddit.com' ||
    url.hostname === 'old.reddit.com' ||
    url.hostname === 'redd.it'
  )
    return { status: true, platform: 'Reddit', url };
  if (url.hostname === 'pixiv.net' || url.hostname === 'www.pixiv.net') return { status: true, platform: 'Pixiv', url };
  if (url.hostname === 'i.pximg.net') return { status: true, platform: 'PixivDirect', url };
  if (/tumblr\.(com|co\.\w+|org)$/i.test(url.hostname || '')) return { status: true, platform: 'Tumblr', url };
  if (url.hostname === 'danbooru.donmai.us') return { status: true, platform: 'Danbooru', url };
  if (url.hostname === 'gelbooru.com' || url.hostname === 'www.gelbooru.com')
    return { status: true, platform: 'Gelbooru', url };
  if (
    url.hostname === 'konachan.com' ||
    url.hostname === 'konachan.net' ||
    url.hostname === 'www.konachan.com' ||
    url.hostname === 'www.konachan.net'
  )
    return { status: true, platform: 'Konachan', url };
  if (url.hostname === 'yande.re' || url.hostname === 'www.yande.re') return { status: true, platform: 'Yandere', url };
  if (url.hostname === 'e-shuushuu.net' || url.hostname === 'www.e-shuushuu.net')
    return { status: true, platform: 'Eshuushuu', url };
  if (url.hostname === 'chan.sankakucomplex.com') return { status: true, platform: 'Sankaku', url };
  if (url.hostname === 'zerochan.net' || url.hostname === 'www.zerochan.net')
    return { status: true, platform: 'Zerochan', url };
  if (url.hostname === 'anime-pictures.net' || url.hostname === 'www.anime-pictures.net')
    return { status: true, platform: 'AnimePictures', url };
  if (url.hostname === 'kemono.party' || url.hostname === 'www.kemono.party' || url.hostname === 'beta.kemono.party')
    return { status: true, platform: 'KemonoParty', url };
  if (
    url.hostname === 'youtube.com' ||
    url.hostname === 'www.youtube.com' ||
    url.hostname === 'youtu.be' ||
    url.hostname === 'm.youtube.com'
  )
    return { status: true, platform: 'Youtube', url };
  if (
    url.hostname === 'tjournal.ru' ||
    url.hostname === 'the.tj' ||
    url.hostname === 'dtf.ru' ||
    url.hostname === 'vc.ru'
  )
    return { status: true, platform: 'Osnova', url };

  return { status: false, platform: '', url };
};

export default CheckForLink;
