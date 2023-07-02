export interface CoubPost {
  flag: unknown;
  abuses: unknown;
  recoubs_by_users_channels: unknown;
  favourite: boolean;
  promoted_id: unknown;
  recoub: unknown;
  like: unknown;
  dislike: unknown;
  reaction: unknown;
  in_my_best2015: boolean;
  id: number;
  type: string;
  permalink: string;
  title: string;
  visibility_type: string;
  original_visibility_type: string;
  channel_id: number;
  created_at: string;
  updated_at: string;
  is_done: boolean;
  views_count: number;
  cotd: unknown;
  cotd_at: unknown;
  visible_on_explore_root: boolean;
  visible_on_explore: boolean;
  featured: boolean;
  published: boolean;
  published_at: string;
  reversed: boolean;
  moderation_state: string;
  from_editor_v2: boolean;
  is_editable: boolean;
  original_sound: boolean;
  has_sound: boolean;
  recoub_to: unknown;
  file_versions: FileVersions;
  audio_versions: Versions;
  image_versions: Versions;
  first_frame_versions: Versions;
  dimensions: Dimensions;
  site_w_h: number[];
  page_w_h: number[];
  site_w_h_small: number[];
  size: number[];
  age_restricted: boolean;
  age_restricted_by_admin: boolean;
  not_safe_for_work: boolean;
  allow_reuse: boolean;
  dont_crop: boolean;
  banned: boolean;
  global_safe: boolean;
  audio_file_url: string;
  external_download: boolean;
  application: unknown;
  channel: Channel;
  file: unknown;
  picture: string;
  timeline_picture: string;
  small_picture: string;
  sharing_picture: unknown;
  percent_done: number;
  tags: Tag[];
  categories: Category[];
  communities: Community[];
  music: Music;
  recoubs_count: number;
  remixes_count: number;
  likes_count: number;
  comments_count: number;
  translated_title: unknown;
  dislikes_count: number;
  raw_video_id: number;
  uploaded_by_ios_app: boolean;
  uploaded_by_android_app: boolean;
  media_blocks: MediaBlocks;
  raw_video_thumbnail_url: string;
  raw_video_title: string;
  video_block_banned: boolean;
  duration: number;
  promo_winner: boolean;
  promo_winner_recoubers: unknown;
  editorial_info: unknown;
  promo_hint: unknown;
  beeline_best_2014: unknown;
  from_web_editor: boolean;
  normalize_sound: boolean;
  normalize_change_allowed: boolean;
  best2015_addable: boolean;
  ahmad_promo: unknown;
  promo_data: unknown;
  audio_copyright_claim: unknown;
  ads_disabled: boolean;
  is_safe_for_ads: boolean;
}

export interface FileVersions {
  html5: HTML5Versions;
  mobile: MobileVersions;
  share: ShareVersion;
}

export interface HTML5Versions {
  video: Video;
  audio: Audio;
}

export interface Video {
  higher: QualityOption;
  high: QualityOption;
  med: QualityOption;
}

export interface Audio {
  high: QualityOption;
  med: QualityOption;
}

export interface QualityOption {
  url: string;
  size: number;
}

export interface MobileVersions {
  video: string;
  audio: string[];
}

export interface ShareVersion {
  default: string;
}

export interface Versions {
  /** Template URL with `"…{version}…"` insertion */
  template: string;
  /**
   * Versions names
   * @example ["big", "med", "small", "ios_large"]
   */
  versions: string[];
}

export interface Dimensions {
  big: number[];
  med: number[];
}

export interface Channel {
  id: number;
  permalink: string;
  title: string;
  description: string;
  followers_count: number;
  following_count: number;
  avatar_versions: Versions;
  background_image: string;
  coubs_count: number;
  recoubs_count: number;
}

export interface Tag {
  id: number;
  title: string;
  value: string;
}

export interface Category {
  id: number;
  title: string;
  permalink: string;
  subscriptions_count: number;
  big_image_url: string;
  small_image_url: string;
  med_image_url: string;
  visible: boolean;
}

export interface Community {
  id: number;
  title: string;
  permalink: string;
  subscriptions_count: number;
  big_image_url: string;
  small_image_url: string;
  med_image_url: string;
  i_subscribed: boolean;
  community_notifications_enabled: unknown;
  description: unknown;
}

export interface Music {
  id: number;
  title: string;
  image_url: string;
  album_name: string;
  genres: string[];
  artist_title: string;
  artist_id: number;
}

export interface MediaBlocks {
  uploaded_raw_videos: unknown[];
  external_raw_videos: unknown[];
  remixed_from_coubs: unknown[];
}

export default CoubPost;
