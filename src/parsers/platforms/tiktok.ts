import YTDlpWrap from 'yt-dlp-wrap';
import { SocialPost } from '../../types/social-post.js';
import LogMessageOrError from '../../util/log.js';
import YtDlpOutput, { Format } from '../../types/yt-dlp.js';
import HumanReadableSize from '../../util/human-readable-size.js';
import VideoCodecConvert from '../../util/video-codec-convert.js';

// eslint-disable-next-line new-cap
const ytDlpClient = new YTDlpWrap.default();

export default function Tiktok(url: URL): Promise<SocialPost | undefined> {
  const isShortened = url.hostname !== 'tiktok.com' && url.hostname !== 'www.tiktok.com';
  const pathParts = url.pathname.split('/').filter(Boolean);

  if ((isShortened && pathParts.length !== 1) || (!isShortened && (pathParts[1] !== 'video' || !pathParts[2]))) {
    LogMessageOrError(`Bad Tiktok video link: ${url.href}`);
    return Promise.resolve(undefined);
  }

  return ytDlpClient
    .execPromise([url.href, '--dump-json'])
    .then(
      (ytDlpPlainOutput) =>
        new Promise((resolve: (ytDlpOutput: YtDlpOutput) => void, reject) => {
          try {
            const parsedYtDlp = JSON.parse(ytDlpPlainOutput);
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

      const isPhotoCardsPost = !ytDlpOutput.formats.some((format) => format.filesize);
      if (isPhotoCardsPost) return Promise.resolve(socialPost);

      const formatsWithBothVideoAudio = ytDlpOutput.formats.filter(
        (format) =>
          typeof format.vcodec === 'string' &&
          format.vcodec !== 'none' &&
          typeof format.acodec === 'string' &&
          format.acodec !== 'none' &&
          !/\.mp3$/.test(format.url)
      );
      const formatsUniqueBySize = formatsWithBothVideoAudio.filter(
        (format, index, array) =>
          index ===
          array.findIndex((comparing) => {
            if ('filesize' in comparing || 'filesize' in format) return comparing.filesize === format.filesize;

            return comparing.filesize_approx === format.filesize_approx;
          })
      );
      const biggestH265Format = formatsUniqueBySize
        .filter((format) => format.vcodec === 'h265')
        .sort(
          (prev, next) => (prev.filesize || prev.filesize_approx || 0) - (next.filesize || next.filesize_approx || 0)
        )
        .pop();
      const formatToConvert = formatsWithBothVideoAudio
        .filter(
          (format) =>
            format.vcodec === 'h265' &&
            format.filesize === biggestH265Format?.filesize &&
            format.format_id !== biggestH265Format?.format_id
        )
        .pop();
      const legacyH264Formats = formatsUniqueBySize.filter((format) => format.vcodec === 'h264');
      const formatsToSend = (
        biggestH265Format ? legacyH264Formats.concat(biggestH265Format) : legacyH264Formats
      ).filter((format): format is Format => !!format);

      formatsToSend.forEach((format) => {
        socialPost.medias.push({
          type: 'video',
          externalUrl: format.url,
          filesize: format.filesize || format.filesize_approx,
          filetype: format.ext,
          description: `${format.width || format.format_id?.match(/^[^_]+_(?<width>\d+)/)?.groups?.width || '720'}p / ${
            format.vcodec.split('.')[0]
          } + ${format.acodec.split('.')[0]} (${format.ext}) – video + audio${
            format.filesize || format.filesize_approx
              ? ` / ${HumanReadableSize(format.filesize || format.filesize_approx)}`
              : ''
          }${/watermark/i.test(format.format_note) ? ' / Watermarked' : ''}`,
        });
      });

      if (legacyH264Formats.length) return Promise.resolve(socialPost);
      if (!formatToConvert?.url) return Promise.resolve(undefined);

      const convertToExtension = 'mp4';
      const convertToVideoCodec = 'h264';
      const convertToAudioCodec = 'aac';
      return VideoCodecConvert(formatToConvert.url, convertToExtension, convertToVideoCodec, convertToAudioCodec)
        .then((convertedVideo) => {
          if ('externalUrl' in convertedVideo) return Promise.resolve(socialPost);

          socialPost.medias.push({
            type: 'video',
            otherSources: {
              videoSource: formatToConvert.url,
            },
            filename: convertedVideo.filename,
            filetype: formatToConvert.ext,
            fileCallback: convertedVideo.fileCallback,
            description: `${
              formatToConvert.width || formatToConvert.format_id?.match(/^[^_]+_(?<width>\d+)/)?.groups?.width || '720'
            }p / ${convertToVideoCodec} + ${convertToAudioCodec} (${convertToExtension}) – video + audio${
              convertedVideo.filesize ? ` / ${HumanReadableSize(convertedVideo.filesize)}` : ''
            } / Converted`,
          });

          return Promise.resolve(socialPost);
        })
        .catch(() => Promise.resolve(socialPost));
    });
}
