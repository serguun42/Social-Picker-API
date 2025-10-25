export interface ServiceConfig {
  PORT: number;
  CUSTOM_IMG_VIEWER_SERVICE: string;
  /** Set to `null` to connect directly */
  PROXY_HOSTNAME?: string;
  /** Set to `null` to connect directly */
  PROXY_PORT?: number;
}

export interface TokensConfig {
  /** Netscape cookies file location for posts (gallery-dl) */
  TWITTER_COOKIE_FILE_LOCATION?: string;

  /** Netscape cookies file location for posts (gallery-dl) and reels (yt-dlp) */
  INSTAGRAM_COOKIE_FILE_LOCATION?: string;

  TUMBLR_OAUTH?: {
    consumer_key: string;
    consumer_secret: string;
    token: string;
    token_secret: string;
  };

  KEMONO_COOKIE?: string;

  REDDIT_COOKIE?: string;

  JOYREACTOR_COOKIE?: string;
}

export interface Configs {
  service: ServiceConfig;
  tokens: TokensConfig;
}

export type ConfigName = keyof Configs;

export type GenericConfig<T extends ConfigName> = Configs[T];
