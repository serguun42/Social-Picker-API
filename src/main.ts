import { createServer, ServerResponse, STATUS_CODES } from 'node:http';

import mime from 'mime-types';

import CheckForLink from './lib/check-for-link.js';
import GenericSocialParser from './parsers/generic.js';
import IS_DEV from './util/is-dev.js';
import { ParseQuery, SafeParseURL } from './util/links/urls.js';
import loadConfig from './util/load-configs.js';
import LogMessageOrError from './util/log.js';

const { PORT } = loadConfig('service');

const VideoHooksStorage: Record<string, () => void> = {};

const SendPayload = (res: ServerResponse, code: number, data: string | Buffer | object) => {
  res.statusCode = code;

  if (data instanceof Buffer || typeof data === 'string') {
    const dataToSend = data.toString();
    res.end(dataToSend);
  } else {
    const dataToSend = JSON.stringify(data);
    res.setHeader('Content-Type', mime.contentType('json') || '');
    res.end(dataToSend);
  }
};

const SendCode = (res: ServerResponse, code: number) => {
  res.statusCode = code || 500;
  res.end(`${code || 500} ${STATUS_CODES[code || 500]}`);
};

createServer((req, res) => {
  const queries = ParseQuery(SafeParseURL(req.url).search);

  res.setHeader('Content-Type', mime.contentType('txt') || '');

  /** Hook for deleting combined videos when they are sent */
  if (queries['video-done']) {
    if (typeof VideoHooksStorage[queries['video-done']] === 'function') VideoHooksStorage[queries['video-done']]();

    return SendCode(res, 200);
  }

  if (typeof queries.url !== 'string') return SendCode(res, 404);

  const checkedForLink = CheckForLink(queries.url);
  if (!checkedForLink.status || !checkedForLink.url || !checkedForLink.platform) return SendCode(res, 404);

  const platformResponse = GenericSocialParser(checkedForLink.platform, checkedForLink.url);
  if (!platformResponse) return SendCode(res, 404);

  return platformResponse
    .then((socialPost) => {
      if (!socialPost?.medias) return SendCode(res, 404);

      socialPost.medias.forEach((media) => {
        const { fileCallback, filename } = media;

        if (typeof fileCallback !== 'function') return;
        if (typeof filename !== 'string') return;

        /** Storing hook for deleting combined videos */
        VideoHooksStorage[filename] = fileCallback;

        /** Deleting video in 5 minutes in any case */
        setTimeout(
          () => {
            fileCallback();
            delete VideoHooksStorage[filename];
          },
          1000 * 60 * 5
        );
      });

      return SendPayload(res, 200, socialPost);
    })
    .catch((e: Error) => {
      LogMessageOrError(e);
      SendCode(res, 500);
    });
}).listen(PORT);

if (IS_DEV) process.stdout.write(`\x1BcStarted dev instance on http://localhost:${PORT}/?url=REPLACE\n`);
