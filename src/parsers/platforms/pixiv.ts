import { parse as parseHTML } from 'node-html-parser';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { SocialPost } from '../../types/social-post.js';
import LoadConfig from '../../util/load-configs.js';
import DEFAULT_HEADERS from '../default-headers.js';
import { PixivPreload, UgoiraMeta } from '../../types/pixiv.js';
import UgoiraBuilder from '../../util/ugoira-builder.js';
import FormViewerURL from '../../util/form-viewer-url.js';

const { PROXY_HOSTNAME, PROXY_PORT } = LoadConfig('service');
const PROXY_AGENT =
  PROXY_HOSTNAME && PROXY_PORT ? new SocksProxyAgent(`socks5://${PROXY_HOSTNAME}:${PROXY_PORT}`) : undefined;

export default function Pixiv(
  url: URL,
  /** Unique parameter only for parser `PixivDirect` */
  certainImageIndex?: number
): Promise<SocialPost | undefined> {
  const PIXIV_PAGE_RX = /^\/(?:\w{2}\/)?artworks\/(?<illustId>\d+)/i;
  const PIXIV_HEADERS = {
    ...DEFAULT_HEADERS,
    referer: 'https://www.pixiv.net/',
  };

  const pageMatch = url.pathname.match(PIXIV_PAGE_RX);
  /** @type {string} */
  const illustId = pageMatch?.groups?.illustId || url.searchParams.get('illust_id');
  if (!illustId) return Promise.resolve(undefined);

  const postURL = `https://www.pixiv.net/en/artworks/${illustId}`;

  return fetch(postURL, { headers: PIXIV_HEADERS, agent: PROXY_AGENT })
    .then((res) => {
      if (res.ok) return res.text();
      return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
    })
    .then((pixivPage) => {
      try {
        const parsedHTML = parseHTML(pixivPage);

        const metaPreloadData = parsedHTML.getElementById('meta-preload-data');
        if (!metaPreloadData) throw new Error('No <metaPreloadData> in <pixivPage>');

        const preloadContentRaw = metaPreloadData.getAttribute('content');
        if (!preloadContentRaw) throw new Error('No <preloadContent> in <metaPreloadData>');

        return Promise.resolve(JSON.parse(preloadContentRaw) as PixivPreload);
      } catch (e) {
        return Promise.reject(e);
      }
    })
    .then((pixivPreload) => {
      const post = pixivPreload?.illust?.[illustId];
      if (!post) return Promise.reject(new Error(`No <post> in preloadContent: ${postURL}`));

      const socialPost: SocialPost = {
        caption: post.title || post.illustTitle || post.description || post.illustComment,
        author: post.userName,
        authorURL: `https://www.pixiv.net/en/users/${post.userId}`,
        postURL,
        medias: [],
      };

      /** Aka GIF stored as jpg/png in zip */
      const isUgoira =
        Object.keys(post.urls || {})
          .map((key) => post.urls[key as keyof import('../../types/pixiv.js').Urls] || '')
          .some((firstImgUrl) => typeof firstImgUrl === 'string' && /ugoira/i.test(firstImgUrl)) ||
        post.tags?.tags?.some((tag) => /ugoira/i.test(tag.romaji));

      if (isUgoira) {
        const ugoiraMetaUrl = `https://www.pixiv.net/ajax/illust/${illustId}/ugoira_meta`;

        return fetch(ugoiraMetaUrl, { headers: PIXIV_HEADERS, agent: PROXY_AGENT })
          .then((res) => {
            if (res.ok) return res.json() as Promise<UgoiraMeta>;
            return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
          })
          .then((ugoiraMeta) => {
            const uroiraOriginalZip = ugoiraMeta.body.originalSrc;
            return fetch(uroiraOriginalZip, { headers: PIXIV_HEADERS, agent: PROXY_AGENT })
              .then((res) => {
                if (res.ok) return res.arrayBuffer();
                return Promise.reject(new Error(`Status code ${res.status} ${res.statusText} (${res.url})`));
              })
              .then((ugoiraSourceZip) => UgoiraBuilder(ugoiraMeta, ugoiraSourceZip))
              .then((ugoiraBuilt) => {
                if (!ugoiraBuilt) return Promise.resolve(undefined);

                socialPost.medias.push({ ...ugoiraBuilt });
                return Promise.resolve(socialPost);
              });
          });
      }

      /** Extremely dirty backup way to extract anything valuable from Pixiv post */
      const { dirtyImageDate, dirtyImageFiletype } =
        JSON.stringify(post).match(
          new RegExp(`"[^"]+(?<dirtyImageDate>img/(\\d+/){6}${illustId}_p)[^"]+\\.(?<dirtyImageFiletype>\\w+)"`)
        )?.groups || {};

      const dirtyOriginalImage =
        dirtyImageDate && dirtyImageFiletype
          ? `https://i.pximg.net/img-original/${dirtyImageDate}0.${dirtyImageFiletype}`
          : '';
      const dirtyMasterImage =
        dirtyImageDate && dirtyImageFiletype
          ? `https://i.pximg.net/img-master/${dirtyImageDate}0_master1200.${dirtyImageFiletype}`
          : '';

      const sourcesAmount = post?.pageCount;
      const origFilename = post.urls.original || dirtyOriginalImage;

      if (!origFilename)
        return Promise.reject(
          new Error(
            `No <origFilename> in post ${postURL} (${JSON.stringify({ dirtyImageDate, dirtyImageFiletype }, null, 2)})`
          )
        );

      const origBasename = origFilename.replace(/\d+\.(\w+)$/, '');
      const origFiletype = origFilename.match(/\.(?<filetype>\w+)$/)?.groups?.filetype || 'png';
      const masterFilename = post.urls.regular || dirtyMasterImage;

      for (let sourceIndex = 0; sourceIndex < sourcesAmount; sourceIndex++) {
        if (!(typeof certainImageIndex === 'number' && certainImageIndex !== sourceIndex))
          socialPost.medias.push({
            type: 'photo',
            externalUrl: FormViewerURL(
              masterFilename.replace(/\d+(_master\d+\.\w+$)/i, `${sourceIndex}$1`),
              'https://www.pixiv.net/',
              true
            ),
            filetype: origFiletype,
            original: FormViewerURL(`${origBasename}${sourceIndex}.${origFiletype}`, 'https://www.pixiv.net/', true),
          });
      }

      return Promise.resolve(socialPost);
    });
}
