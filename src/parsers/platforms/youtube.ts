import YTDlpWrap from 'yt-dlp-wrap';
import { SocialPost } from '../../types/social-post.js';
import LogMessageOrError from '../../util/log.js';
import { ParsePath, ParseQuery } from '../../util/urls.js';
import YtDlpOutput from '../../types/yt-dlp.js';
import HumanReadableSize from '../../util/human-readable-size.js';

// eslint-disable-next-line new-cap
const ytDlpClient = new YTDlpWrap.default();

export default function Youtube(url: URL): Promise<SocialPost | undefined> {
  const queries = ParseQuery(url.search);
  const path = ParsePath(url.pathname);

  const brevityDomainId = /youtu\.be/gi.test(url.hostname) && path[0];
  const shortsId = /youtube\.com/gi.test(url.hostname) && path[0] === 'shorts' && path[1];
  const regularId = /youtube\.com/gi.test(url.hostname) && path[0] === 'watch' && queries?.v;

  if (!brevityDomainId && !shortsId && !regularId) {
    LogMessageOrError(`Bad Youtube video link: ${url.href}`);
    return Promise.resolve(undefined);
  }

  const youtubeLink = `https://www.youtube.com/watch?v=${brevityDomainId || shortsId || regularId}`;

  return ytDlpClient
    .execPromise([youtubeLink, '--dump-json'])
    .then(
      (ytDlpPlainOutput) =>
        new Promise((resolve: (ytDlpOutput: YtDlpOutput) => void, reject) => {
          try {
            const parsedYtDlp = JSON.parse(ytDlpPlainOutput) as YtDlpOutput;
            resolve(parsedYtDlp);
          } catch (e) {
            reject(e);
          }
        })
    )
    .then((ytDlpOutput) => {
      const socialPost: SocialPost = {
        author: ytDlpOutput.uploader,
        authorURL: ytDlpOutput.uploader_url,
        caption: ytDlpOutput.title + (ytDlpOutput.description?.length < 50 ? `\n\n${ytDlpOutput.description}` : ''),
        postURL: ytDlpOutput.webpage_url,
        medias: [],
      };

      if (!ytDlpOutput.formats) return Promise.resolve(socialPost);

      const sortedFormats = ytDlpOutput.formats.sort((prev, next) => (prev.height || 0) - (next.height || 0));

      sortedFormats.forEach((format) => {
        if (
          (!format.vcodec || format.vcodec === 'none') &&
          typeof format.acodec === 'string' &&
          format.acodec !== 'none'
        )
          socialPost.medias.push({
            type: 'audio',
            externalUrl: format.url,
            filesize: format.filesize || format.filesize_approx,
            filetype: format.ext,
            description: `${format.format_note} / ${format.acodec.split('.')[0]} (${format.ext}) – audio${
              format.filesize || format.filesize_approx
                ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
                : ''
            }`,
          });
        else if (
          (!format.acodec || format.acodec === 'none') &&
          typeof format.vcodec === 'string' &&
          format.vcodec !== 'none'
        )
          socialPost.medias.push({
            type: 'video',
            externalUrl: format.url,
            filesize: format.filesize || format.filesize_approx,
            filetype: format.ext,
            description: `${format.format_note} / ${format.vcodec.split('.')[0]} (${format.ext}) – video${
              format.filesize || format.filesize_approx
                ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
                : ''
            }`,
          });
        else if (
          typeof format.acodec === 'string' &&
          format.acodec !== 'none' &&
          typeof format.vcodec === 'string' &&
          format.vcodec !== 'none'
        )
          socialPost.medias.push({
            type: 'video',
            externalUrl: format.url,
            filesize: format.filesize || format.filesize_approx,
            filetype: format.ext,
            description: `${format.format_note} / ${format.vcodec.split('.')[0]} + ${format.acodec.split('.')[0]} (${
              format.ext
            }) – video + audio${
              format.filesize || format.filesize_approx
                ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
                : ''
            }`,
          });
      });

      return Promise.resolve(socialPost);
    });
}
