/* eslint-disable no-console */
import { writeFile } from 'fs/promises';
import IS_DEV from './is-dev.js';

/**
 * @param  {(string | Error)[]} args
 * @returns {void}
 */
const LogMessageOrError = (...args) => {
  const containsError = args.some(
    (message) => message instanceof Error || (typeof message === 'string' && /test/i.test(message))
  );
  const out = containsError ? console.error : console.log;

  out(new Date());
  out(...args);
  out(Array.from({ length: 30 }, () => '~').join(''));

  if (IS_DEV) writeFile('./out/logmessageorerror.json', JSON.stringify(args, false, '\t')).catch(console.warn);
};

export default LogMessageOrError;
