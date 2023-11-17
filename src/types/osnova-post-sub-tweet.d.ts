export interface Sizes {
  [sizeName: string]: {
    w: number;
    h: number;
    resize: 'fit' | 'crop';
  };
}

export interface Media {
  id: number;
  id_str: string;
  indices: number[];
  media_url: string;
  media_url_https: string;
  url: string;
  display_url: string;
  expanded_url: string;
  type: string;
  sizes: Sizes;
}

export interface Entities {
  hashtags: unknown[];
  symbols: unknown[];
  user_mentions: unknown[];
  urls: unknown[];
  media: Media[];
}

export interface ExtendedEntities {
  media: Media[];
}

export interface UrlEntity {
  url: string;
  expanded_url: string;
  display_url: string;
  indices: number[];
}

export interface Description {
  urls: UrlEntity[];
}

export interface UserEntities {
  url: UrlEntity[];
  description: Description;
}

export interface User {
  id: number;
  id_str: string;
  name: string;
  screen_name: string;
  location: string;
  description: string;
  url: string;
  entities: UserEntities;
  protected: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  created_at: string;
  favourites_count: number;
  utc_offset?: unknown;
  time_zone?: unknown;
  geo_enabled: boolean;
  verified: boolean;
  statuses_count: number;
  lang?: unknown;
  contributors_enabled: boolean;
  is_translator: boolean;
  is_translation_enabled: boolean;
  profile_background_color: string;
  profile_background_image_url: string;
  profile_background_image_url_https: string;
  profile_background_tile: boolean;
  profile_image_url: string;
  profile_image_url_https: string;
  profile_link_color: string;
  profile_sidebar_border_color: string;
  profile_sidebar_fill_color: string;
  profile_text_color: string;
  profile_use_background_image: boolean;
  has_extended_profile: boolean;
  default_profile: boolean;
  default_profile_image: boolean;
  following?: unknown;
  follow_request_sent?: unknown;
  notifications?: unknown;
  translator_type: string;
  withheld_in_countries: unknown[];
}

export interface Tweet {
  created_at: string;
  id: number;
  id_str: string;
  full_text: string;
  truncated: boolean;
  display_text_range: number[];
  entities: Entities;
  extended_entities: ExtendedEntities;
  source: string;
  in_reply_to_status_id?: unknown;
  in_reply_to_status_id_str?: unknown;
  in_reply_to_user_id?: unknown;
  in_reply_to_user_id_str?: unknown;
  in_reply_to_screen_name?: unknown;
  user: User;
  geo?: unknown;
  coordinates?: unknown;
  place?: unknown;
  contributors?: unknown;
  is_quote_status: boolean;
  retweet_count: number;
  favorite_count: number;
  favorited: boolean;
  retweeted: boolean;
  possibly_sensitive: boolean;
  possibly_sensitive_appealable: boolean;
  lang: string;
}
