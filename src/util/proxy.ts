import { SocksProxyAgent } from 'socks-proxy-agent';

import loadConfig from './load-configs.js';

const { PROXY_HOSTNAME, PROXY_PORT } = loadConfig('service');

const PROXY_AGENT =
  PROXY_HOSTNAME && PROXY_PORT ? new SocksProxyAgent(`socks5://${PROXY_HOSTNAME}:${PROXY_PORT}`) : undefined;

export default PROXY_AGENT;
