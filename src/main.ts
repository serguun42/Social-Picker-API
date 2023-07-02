import { STATUS_CODES, createServer } from 'http';
import SocialParser from './core/social-parsers.js';
import CheckForLink from './util/check-for-link.js';
import { LoadServiceConfig } from './util/load-configs.js';
import LogMessageOrError from './util/log.js';
import { SafeParseURL, ParseQuery } from './util/urls.js';
import DEV from './util/is-dev.js';

const { PORT } = LoadServiceConfig();

/**
 * @param {{[code: string]: string}} statusCodes
 * @returns {{[code: number]: string}}
 */
const GetStatusCodes = (statusCodes) => {
  const newCodes = {};

  Object.keys(statusCodes).forEach((code) => {
    newCodes[code] = `${code} ${statusCodes[code]}`;
  });

  return newCodes;
};

/**
 * HTTP Response Statuses
 * @type {{[code: number]: string}}
 */
const STATUSES = GetStatusCodes(STATUS_CODES);

/**
 * @type {{ [combinedFilename: string]: () => string }}
 */
const VideoHooksStorage = {};

createServer((req, res) => {
  const queries = ParseQuery(SafeParseURL(req.url).search);

  res.setHeader('Content-Type', 'charset=UTF-8');

  /**
   * @param {number} code
   * @param {string | Buffer | ReadStream | Object} data
   * @returns {false}
   */
  const SendObject = (code, data) => {
    res.statusCode = code;

    if (data instanceof Buffer || typeof data === 'string') {
      const dataToSend = data.toString();

      res.end(dataToSend);
    } else {
      const dataToSend = JSON.stringify(data);
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');

      res.end(dataToSend);
    }

    return false;
  };

  /**
   * @param {number} code
   * @returns {false}
   */
  const SendStatus = (code) => {
    res.statusCode = code || 200;
    res.end(STATUSES[code || 200]);
    return false;
  };

  /** Hook for deleting combined videos when they are sent */
  if (queries['video-done']) {
    if (typeof VideoHooksStorage[queries['video-done']] === 'function') VideoHooksStorage[queries['video-done']]();

    return SendStatus(200);
  }

  if (typeof queries.url === 'string') {
    const checkedForLink = CheckForLink(queries.url);
    if (!checkedForLink.status || !checkedForLink.url || !checkedForLink.platform) return SendStatus(404);

    const platformResponse = SocialParser(checkedForLink.platform, checkedForLink.url);
    if (!platformResponse) return SendStatus(404);

    return platformResponse
      .then((socialPost) => {
        if (!socialPost?.medias) return SendStatus(404);

        socialPost.medias.forEach((media) => {
          if (!media.fileCallback) return;

          /** Storing hook for deleting combined videos */
          VideoHooksStorage[media.filename] = media.fileCallback;

          /** Deleting video in 5 minutes in any case */
          setTimeout(() => {
            media.fileCallback();
            delete VideoHooksStorage[media.filename];
          }, 1000 * 60 * 5);
        });

        return SendObject(200, socialPost);
      })
      .catch((e) => {
        LogMessageOrError(e);
        SendStatus(500);
      });
  }
  return SendStatus(404);
}).listen(PORT);

if (DEV) process.stdout.write(`\x1BcStarted dev instance on http://localhost:${PORT}/?url=DEFAULT\n`);
