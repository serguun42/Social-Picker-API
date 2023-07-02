/**
 * @param {string} escaping
 * @returns {string}
 */
export const SafeEscape = (escaping) => {
  if (typeof escaping !== 'string') return escaping;

  return escaping
    .replace(/(\/+)/gi, '/')
    .replace(/\.\.%2F/gi, '')
    .replace(/\.\.\//g, '');
};

/**
 * @param {string} decoding
 * @returns {string}
 */
export const SafeDecode = (decoding) => {
  if (typeof decoding !== 'string') return decoding;

  try {
    const decoded = decodeURIComponent(decoding);
    return SafeEscape(decoded);
  } catch (e) {
    return SafeEscape(decoding);
  }
};

/**
 * @param {string} headers
 * @returns {{[name: string]: string}}
 */
export const ParseCookie = (headers) => {
  if (!headers.cookie) return {};

  const returningList = {};
  const cookies = headers.cookie;

  cookies.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const cookieName = parts.shift().trim();
    const cookieValue = parts.join('=');

    try {
      returningList[cookieName] = decodeURIComponent(cookieValue);
    } catch (e) {
      returningList[cookieName] = cookieValue;
    }
  });

  return returningList;
};

/**
 * @param {string | string[]} path
 * @returns {string[]}
 */
export const ParsePath = (path) => {
  if (path instanceof Array) {
    if (path.every((part) => typeof part === 'string'))
      return [].concat(...path.map((part) => part.split('/'))).filter(Boolean);
    return path;
  }
  if (typeof path === 'string') return path.replace().split('/').filter(Boolean);
  return path;
};

/**
 * @param {string} query
 * @returns {{[queryName: string]: string | true}}
 */
export const ParseQuery = (query) => {
  if (!query) return {};

  const returningList = {};

  try {
    const searchParams = new URLSearchParams(query);
    searchParams.forEach((value, key) => {
      returningList[key] = value || true;
    });
  } catch (e) {
    query
      .toString()
      .replace(/^\?/, '')
      .split('&')
      .forEach((queryPair) => {
        try {
          if (queryPair.split('=')[1])
            returningList[queryPair.split('=')[0]] = decodeURIComponent(queryPair.split('=')[1]);
          else returningList[queryPair.split('=')[0]] = true;
        } catch (_) {
          returningList[queryPair.split('=')[0]] = queryPair.split('=')[1] || true;
        }
      });
  }

  return returningList;
};

/**
 * @param {{[queryName: string]: string | true}} queries
 * @returns {string}
 */
export const CombineQueries = (queries) => {
  if (typeof queries !== 'object') return '';
  if (!Object.keys(queries).length) return '';

  return `?${Object.keys(queries)
    .map((key) => (queries[key] === true ? key : `${key}=${encodeURIComponent(queries[key])}`))
    .join('&')}`;
};

/**
 * @param {string | URL} link
 * @param {string | URL} [base]
 * @returns {URL}
 */
export const SafeParseURL = (link, base) => {
  try {
    return new URL(link, base);
    // eslint-disable-next-line no-empty
  } catch (e) {}

  try {
    return new URL(`https://${link}`);
    // eslint-disable-next-line no-empty
  } catch (e) {}

  try {
    return new URL(link, 'https://example.com');
    // eslint-disable-next-line no-empty
  } catch (e) {}

  return new URL('https://example.com');
};
