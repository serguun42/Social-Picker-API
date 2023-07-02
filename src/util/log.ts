/* eslint-disable no-console */
import { writeFile } from 'node:fs/promises';
import { inspect } from 'node:util';
import IS_DEV from './is-dev.js';

const SHORT_DELIMITER = Array.from({ length: 30 }, () => '~').join('');
const START_DELIMITER = Array.from({ length: 30 }, () => '🔽').join('');
const END_DELIMITER = Array.from({ length: 30 }, () => '🔼').join('');

const WrapForOutput = (...args: unknown[]): string =>
  args.map((arg) => inspect(arg, { depth: Infinity, colors: true })).join(`\n${SHORT_DELIMITER}\n`);

export default function LogMessageOrError(...args: (string | Error | unknown)[]): void {
  const containsError = args.some(
    (message) => message instanceof Error || (typeof message === 'string' && /error/i.test(message))
  );
  const out = containsError ? console.error : console.log;
  const wrapped = WrapForOutput(...args);

  out(START_DELIMITER);
  out(new Date());
  out(wrapped);
  out(END_DELIMITER);

  if (IS_DEV) writeFile('./out/logmessageorerror.json', JSON.stringify(args, null, '\t')).catch(console.warn);
}
