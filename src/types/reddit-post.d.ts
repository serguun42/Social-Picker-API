export type RedditPost = RedditPostSection[];
export default RedditPost;

export interface RedditPostSection {
  kind: string;
  data: {
    after: any;
    dist: number;
    modhash: string;
    geo_filter: string;
    children: Child[];
    before: any;
  };
}

export interface Child {
  kind: string;
  data: ChildData;
}

export interface RedditVideo {
  bitrate_kbps: number;
  /** Primary video URL */
  fallback_url: string;
  height: number;
  width: number;
  scrubber_media_url: string;
  dash_url: string;
  duration: number;
  /** Link to HSL playlist with all streams */
  hls_url: string;
  is_gif: boolean;
  transcoding_status: string;
}

export interface ChildData {
  approved_at_utc: any;
  subreddit: string;
  selftext: string;
  user_reports: any[];
  saved: boolean;
  mod_reason_title: any;
  gilded: number;
  clicked: boolean;
  title: string;
  link_flair_richtext: any[];
  subreddit_name_prefixed: string;
  hidden: boolean;
  pwls: number;
  link_flair_css_class: string;
  downs: number;
  thumbnail_height: number;
  top_awarded_type: any;
  parent_whitelist_status: string;
  hide_score: boolean;
  name: string;
  quarantine: boolean;
  link_flair_text_color: string;
  upvote_ratio: number;
  author_flair_background_color: any;
  ups: number;
  domain: string;
  media_embed: MediaEmbed;
  thumbnail_width: number;
  author_flair_template_id: string;
  is_original_content: boolean;
  author_fullname: string;
  is_reddit_media_domain: boolean;
  is_meta: boolean;
  category: any;
  secure_media_embed: SecureMediaEmbed;
  link_flair_text: string;
  can_mod_post: boolean;
  score: number;
  approved_by: any;
  is_created_from_ads_ui: boolean;
  author_premium: boolean;
  thumbnail: string;
  edited: boolean;
  author_flair_css_class: string;
  author_flair_richtext: any[];
  gildings: Gildings;
  post_hint: string;
  content_categories: any;
  is_self: boolean;
  subreddit_type: string;
  created: number;
  link_flair_type: string;
  wls: number;
  removed_by_category: any;
  banned_by: any;
  author_flair_type: string;
  total_awards_received: number;
  allow_live_comments: boolean;
  selftext_html: any;
  likes: any;
  suggested_sort: any;
  banned_at_utc: any;
  url_overridden_by_dest: string;
  view_count: any;
  archived: boolean;
  no_follow: boolean;
  is_crosspostable: boolean;
  pinned: boolean;
  over_18: boolean;
  preview: Preview;
  all_awardings: any[];
  awarders: any[];
  media_only: boolean;
  link_flair_template_id: string;
  can_gild: boolean;
  spoiler: boolean;
  locked: boolean;
  author_flair_text: string;
  treatment_tags: any[];
  visited: boolean;
  removed_by: any;
  mod_note: any;
  distinguished: any;
  subreddit_id: string;
  author_is_blocked: boolean;
  mod_reason_by: any;
  num_reports: any;
  removal_reason: any;
  link_flair_background_color: string;
  id: string;
  is_robot_indexable: boolean;
  num_duplicates: number;
  report_reasons: any;
  author: string;
  discussion_type: any;
  num_comments: number;
  send_replies: boolean;
  contest_mode: boolean;
  author_patreon_flair: boolean;
  author_flair_text_color: string;
  permalink: string;
  whitelist_status: string;
  stickied: boolean;
  url: string;
  subreddit_subscribers: number;
  created_utc: number;
  num_crossposts: number;
  mod_reports: any[];
  is_video: boolean;

  media?: { reddit_video: RedditVideo };
  secure_media?: { reddit_video: RedditVideo };

  gallery_data?: {
    items: [
      {
        /** Check with this id `media_metadata` field */
        media_id: string;
        id: number;
      }
    ];
  };
  media_metadata?: {
    [mediaKey: string]: {
      status: 'valid';
      e: string;
      /** MIME-type */
      m: string;
      /** Processed media (usually of smaller size) */
      p: {
        /** Width */
        x: number;
        /** Height */
        y: number;
        /** URL */
        u: string;
      }[];
      /** Source media */
      s: {
        /** Width */
        x: number;
        /** Height */
        y: number;
        /** URL */
        u: string;
      };
      /** Can be used to retrieve media from `https://i.redd.it/%ID%.png` (if it's an image or whatever) */
      id: string;
    };
  };
  /** Crosspost parent, `t3_ACTUALID` */
  crosspost_parent?: string;
}

export interface MediaEmbed {}

export interface SecureMediaEmbed {}

export interface Gildings {}

export interface Preview {
  images: Image[];
  enabled: boolean;
}

export interface Image {
  source: Source;
  resolutions: Source[];
  variants: {
    [variantName: string]: Variant;
    gif: Variant;
    mp4: Variant;
  };
  id: string;
}

export interface Source {
  url: string;
  width: number;
  height: number;
}

export interface Variant {
  source: Source;
  resolutions: Source[];
}
