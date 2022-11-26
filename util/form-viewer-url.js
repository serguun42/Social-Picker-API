import { LoadServiceConfig } from './load-configs.js';

const { CUSTOM_IMG_VIEWER_SERVICE } = LoadServiceConfig();

/**
 * @param {string} link Original link from layout
 * @param {string} origin Site's origin or referer
 * @returns {string}
 */
const FormViewerURL = (link, origin) => {
  const replaced = CUSTOM_IMG_VIEWER_SERVICE.replace(/__LINK__/, link).replace(
    /__HEADERS__/,
    JSON.stringify({ referer: origin })
  );

  try {
    return decodeURI(replaced);
  } catch (e) {
    return replaced;
  }
};

export default FormViewerURL;
