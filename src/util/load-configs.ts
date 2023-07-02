import { readFileSync } from 'fs';
import { join } from 'path';
import IS_DEV from './is-dev.js';
import LogMessageOrError from './log.js';

/** @type {{ [key in import('../types/configs').ConfigName]: import('../types/configs').GenericConfig }} */
const CONFIG_STORAGE = {};

/**
 * @param {import('../types/configs').ConfigName} configName
 * @returns {import('../types/configs').GenericConfig}
 */
const LoadConfig = (configName) => {
  if (configName !== 'service' && configName !== 'tokens') return {};

  const configFilePath = join(process.cwd(), 'config', `${configName}${IS_DEV ? '.dev' : ''}.json`);

  try {
    const rawJson = CONFIG_STORAGE[configName] || readFileSync(configFilePath).toString();
    CONFIG_STORAGE[configName] = rawJson;
    return JSON.parse(rawJson);
  } catch (e) {
    LogMessageOrError(e);
    return {};
  }
};

/** @returns {import('../types/configs').ServiceConfig} */
export const LoadServiceConfig = () => LoadConfig('service');

/** @returns {import('../types/configs').TokensConfig} */
export const LoadTokensConfig = () => LoadConfig('tokens');
