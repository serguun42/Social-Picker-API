import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import IS_DEV from './is-dev.js';
import LogMessageOrError from './log.js';
import { ConfigName, GenericConfig } from '../types/configs.js';

const RAW_CONFIG_STORAGE: Record<string, string> = {};

export default function LoadConfig<T extends ConfigName>(configName: T): GenericConfig<T> {
  const configFilePath = join(process.cwd(), 'config', `${configName}${IS_DEV ? '.dev' : ''}.json`);

  try {
    const rawJson = RAW_CONFIG_STORAGE[configName] || readFileSync(configFilePath).toString();
    RAW_CONFIG_STORAGE[configName] = rawJson;
    return JSON.parse(rawJson);
  } catch (e) {
    LogMessageOrError(e as Error);
    throw new Error(`Cannot read config: ${configName}`);
  }
}
