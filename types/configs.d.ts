export type ConfigName = 'service' | 'tokens';

export type ServiceConfig = {
  PORT: number;
  CUSTOM_IMG_VIEWER_SERVICE: string;
  PROXY_HOSTNAME?: string;
  PROXY_PORT?: number;
};

export type TokensConfig = {
  TWITTER_OAUTH: {
    consumer_key: string;
    consumer_secret: string;
    access_token_key: string;
    access_token_secret: string;
  };
  /** Cookies from browser */
  INSTAGRAM_COOKIE: string;
  /** Netscape cookies file location for Reels/yt-dlp */
  INSTAGRAM_COOKIE_FILE_LOCATION: string;
  TUMBLR_OAUTH: {
    consumer_key: string;
    consumer_secret: string;
    token: string;
    token_secret: string;
  };
  JOYREACTOR_COOKIE: string;
};

export type GenericConfig = ServiceConfig | TokensConfig;
