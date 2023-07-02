import LoadConfig from './load-configs.js';

const { CUSTOM_IMG_VIEWER_SERVICE } = LoadConfig('service');

/** Creates proxy URL for image storages with limited access */
export default function FormViewerURL(
  /** Original link from layout */ link: string,
  /** Site's origin or referer */ origin: string,
  /** Apply proxy when viewer is loaded */ useProxy?: boolean
): string {
  const replaced = CUSTOM_IMG_VIEWER_SERVICE.replace(/__LINK__/, link)
    .replace(/__HEADERS__/, JSON.stringify({ referer: origin }))
    .replace(/__PROXY__/, useProxy ? '1' : '0');

  try {
    return decodeURI(replaced);
  } catch (e) {
    return replaced;
  }
}
