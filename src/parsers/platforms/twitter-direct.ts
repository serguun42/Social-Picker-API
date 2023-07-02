import { SocialPost } from '../../types/social-post.js';

export default function TwitterDirect(url: URL): Promise<SocialPost | undefined> {
  if (url.hostname === 'video.twimg.com') {
    url.search = '';

    return Promise.resolve({
      author: '',
      authorURL: '',
      caption: '',
      postURL: url.href,
      medias: [
        {
          type: 'video',
          externalUrl: url.href,
          original: url.href,
        },
      ],
    });
  }

  const format = url.searchParams.get('format') || 'jpg';
  const mediaPathname = url.pathname.replace(/:\w+$/, '').replace(/\.\w+$/, '');

  return Promise.resolve({
    author: '',
    authorURL: '',
    caption: '',
    postURL: `https://pbs.twimg.com${mediaPathname}.${format}`,
    medias: [
      {
        type: 'photo',
        externalUrl: `https://pbs.twimg.com${mediaPathname}.${format}`,
        original: `https://pbs.twimg.com${mediaPathname}.${format}:orig`,
      },
    ],
  });
}
