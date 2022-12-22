import { LoadServiceConfig } from './load-configs.js';

const { CUSTOM_IMG_VIEWER_SERVICE } = LoadServiceConfig();

/**
 * @param {string} link Original link from layout
 * @param {string} origin Site's origin or referer
 * @param {boolean} [useProxy] Apply proxy when viewer is loaded
 * @returns {string}
 */
const FormViewerURL = (link, origin, useProxy) => {
  const replaced = CUSTOM_IMG_VIEWER_SERVICE.replace(/__LINK__/, link)
    .replace(/__HEADERS__/, JSON.stringify({ referer: origin }))
    .replace(/__PROXY__/, useProxy ? 1 : 0);

  try {
    return decodeURI(replaced);
  } catch (e) {
    return replaced;
  }
};

export default FormViewerURL;
