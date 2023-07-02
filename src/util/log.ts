/* eslint-disable no-console */
import { writeFile } from 'fs/promises';
import { inspect } from 'util';
import IS_DEV from './is-dev.js';

const SHORT_DELIMITER = Array.from({ length: 30 }, () => '~').join('');
const LONG_DELIMITER = Array.from({ length: 30 }, () => '🔼').join('');

/**
 * @param {...any} args
 * @returns {string}
 */
const WrapForOutput = (...args) =>
  args.map((arg) => inspect(arg, { depth: Infinity, colors: true })).join(`\n${SHORT_DELIMITER}\n`);

/**
 * @param  {...(string | Error)} args
 * @returns {void}
 */
const LogMessageOrError = (...args) => {
  const containsError = args.some(
    (message) => message instanceof Error || (typeof message === 'string' && /test/i.test(message))
  );
  const out = containsError ? console.error : console.log;
  const wrapped = WrapForOutput(...args);

  out(new Date());
  out(wrapped);
  out(LONG_DELIMITER);

  if (IS_DEV) writeFile('./out/logmessageorerror.json', JSON.stringify(args, false, '\t')).catch(console.warn);
};

export default LogMessageOrError;
