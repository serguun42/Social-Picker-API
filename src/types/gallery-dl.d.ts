interface GalleryDLTwitterTweet {
  author: GalleryDLTwitterUser;
  bookmark_count: number;
  category: 'twitter';
  content: string;
  count: number;
  date: string;
  favorite_count: number;
  lang: string;
  quote_count: number;
  quote_id: number;
  reply_count: number;
  reply_id: number;
  retweet_count: number;
  retweet_id: number;
  sensitive: boolean;
  sensitive_flags: unknown[];
  source: string;
  source_id: number;
  subcategory: string;
  tweet_id: number;
  user: GalleryDLTwitterUser;
  view_count: number;
}

export type GalleryDLTwitterMediaType = 'photo' | 'video' | 'animated_gif';

export interface GalleryDLTwitterMedia extends GalleryDLTwitterTweet {
  description?: string | null;
  extension: 'mp4' | 'jpg';
  filename: string;
  num: number;
  type: GalleryDLTwitterMediaType;
  height: number;
  width: number;
}

export interface GalleryDLTwitterUser {
  date: string;
  description: string;
  favourites_count: number;
  followers_count: number;
  friends_count: number;
  id: number;
  listed_count: number;
  location: string;
  media_count: number;
  name: string;
  nick: string;
  profile_banner: string;
  profile_image: string;
  protected: boolean;
  statuses_count: number;
  url: string;
  verified: boolean;
}

interface GalleryDLInstagramPost {
  category: 'instagram';
  count: number;
  date: string;
  description: string;
  fullname: string;
  liked: boolean;
  likes: number;
  owner_id: string;
  pinned: unknown[];
  post_date: string;
  post_id: string;
  post_shortcode: string;
  post_url: string;
  subcategory: string;
  tags: string[];
  type: string;
  username: string;
}

type GalleryDLInstagramMediaType = 'reel' | 'post';

interface GalleryDLInstagramMedia {
  category: 'instagram';
  count: number;
  date: string;
  description: string;
  display_url: string;
  extension: 'mp4' | 'jpeg';
  filename: string;
  fullname: string;
  height: number;
  liked: boolean;
  likes: number;
  media_id: string;
  num: number;
  owner_id: string;
  pinned: unknown[];
  post_date: string;
  post_id: string;
  post_shortcode: string;
  post_url: string;
  shortcode: string;
  sidecar_media_id: string;
  sidecar_shortcode: string;
  subcategory: string;
  tagged_users: unknown[];
  tags: string[];
  type: GalleryDLInstagramMediaType;
  username: string;
  video_url?: string | null;
  width: number;
}

export interface GalleryDLResponseByPlatform {
  twitter: [2, GalleryDLTwitterTweet] | [3, string, GalleryDLTwitterMedia];
  instagram: [2, GalleryDLInstagramPost] | [3, string, GalleryDLInstagramMedia];
}

export type GalleryDLPlatform = keyof GalleryDLResponseByPlatform;

export type GalleryDLResponse<P extends GalleryDLPlatform> = GalleryDLResponseByPlatform[P][];
