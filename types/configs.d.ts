export type ConfigName = 'service' | 'tokens';

export type ServiceConfig = {
  PORT: number;
  CUSTOM_IMG_VIEWER_SERVICE: string;
};

export type TokensConfig = {
  TWITTER_OAUTH: {
    consumer_key: string;
    consumer_secret: string;
    access_token_key: string;
    access_token_secret: string;
  };
  INSTAGRAM_COOKIE: string;
  TUMBLR_OAUTH: {
    consumer_key: string;
    consumer_secret: string;
    token: string;
    token_secret: string;
  };
  JOYREACTOR_COOKIE: string;
};

export type GenericConfig = ServiceConfig | TokensConfig;
