import fetch from 'node-fetch';
import { parse as parseHTML } from 'node-html-parser';
import { SocialPost } from '../../types/social-post.js';
import DEFAULT_HEADERS from '../default-headers.js';
import VideoAudioMerge from '../../util/video-audio-merge.js';
import CoubPost, { QualityOption } from '../../types/coub-post.js';
import { SafeParseURL } from '../../util/urls.js';

export default function Coub(url: URL): Promise<SocialPost | undefined> {
  const COUB_VIDEO_RX = /^\/view\/(?<videoID>\w+)/;
  const videoID = url.pathname.match(COUB_VIDEO_RX)?.groups?.videoID;
  if (!videoID) return Promise.resolve(undefined);

  const postURL = `https://coub.com/view/${videoID}`;

  return fetch(postURL, {
    headers: {
      ...DEFAULT_HEADERS,
      referer: 'https://coub.com/',
    },
  })
    .then((res) => {
      if (!res.ok) return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));

      return res.text();
    })
    .then((coubPage) => {
      try {
        const parsedHTML = parseHTML(coubPage);

        const coubPageCoubJson = parsedHTML.getElementById('coubPageCoubJson');
        if (!coubPageCoubJson) throw new Error('No <coubPageCoubJson> in <coubPage>');

        const post: CoubPost = JSON.parse(coubPageCoubJson.innerHTML.trim());

        if (!post.file_versions) return Promise.reject(new Error(`Coub ${postURL} does not have <file_versions>`));

        const socialPost: SocialPost = {
          author: post.channel.title,
          authorURL: `https://coub.com/${post.channel.permalink}`,
          caption: post.title,
          postURL,
          medias: [],
        };

        let videoToMerge = '';
        let audioToMerge = '';

        if (post.file_versions.html5) {
          const videoQualities: QualityOption[] = Object.values(post.file_versions.html5.video) || [];
          const audioQualities: QualityOption[] = Object.values(post.file_versions.html5.audio) || [];

          videoToMerge = videoQualities.sort((prev, next) => next.size - prev.size).shift()?.url || '';
          audioToMerge = audioQualities.sort((prev, next) => next.size - prev.size).shift()?.url || '';
        } else if (post.file_versions.mobile) {
          videoToMerge = post.file_versions.mobile.video;
          audioToMerge = post.file_versions.mobile.audio.pop() || '';
        } else videoToMerge = post.file_versions.share?.default;

        return VideoAudioMerge(videoToMerge, audioToMerge, { loopVideo: true })
          .catch(() => Promise.resolve({ externalUrl: videoToMerge }))
          .then((videoAudioMerged) => {
            if ('externalUrl' in videoAudioMerged)
              socialPost.medias.push({
                externalUrl: videoAudioMerged.externalUrl,
                type: 'video',
              });
            else if ('filename' in videoAudioMerged)
              socialPost.medias.push({
                type: 'video',
                otherSources: {
                  audioSource: videoAudioMerged.audioSource,
                  videoSource: videoAudioMerged.videoSource,
                },
                filename: videoAudioMerged.filename,
                filetype: SafeParseURL(videoAudioMerged.videoSource).pathname.split('.').pop(),
                fileCallback: videoAudioMerged.fileCallback,
              });

            return Promise.resolve(socialPost);
          });
      } catch (e) {
        return Promise.reject(e);
      }
    });
}
