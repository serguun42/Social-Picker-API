export interface TwitterV2 {
  data: Data;
  includes: Includes;
}

export interface Data {
  attachments: Attachments;
  entities: Entities;
  author_id: string;
  text: string;
  id: string;
  edit_history_tweet_ids: string[];
}

export interface Attachments {
  media_keys: string[];
}

export interface Entities {
  hashtags: HashtagEntity[];
  urls: UrlEntity[];
}

export interface HashtagEntity {
  start: number;
  end: number;
  tag: string;
}

export interface UrlEntity {
  start: number;
  end: number;
  url: string;
  expanded_url: string;
  display_url: string;
  media_key?: string;
}

export interface Includes {
  media: Medium[];
  users: User[];
}

interface MediumPhoto {
  media_key: string;
  type: 'photo';
  width: number;
  height: number;
  url: string;
}

interface MediumVideo {
  media_key: string;
  type: 'video' | 'animated_gif';
  width: number;
  height: number;
  variants: MediaVariant[];
}

export type Medium = MediumPhoto | MediumVideo;

export interface MediaVariant {
  content_type: string;
  url: string;
  bit_rate?: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
}
