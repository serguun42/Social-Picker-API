export interface Blog {
  name: string;
  title: string;
  description: string;
  url: string;
  uuid: string;
  updated: number;
}

export interface Colors {
  c0: string;
  c1: string;
}

export interface Medium {
  media_key: string;
  type: string;
  width: number;
  height: number;
  url: string;
  colors: Colors;
  has_original_dimensions: boolean;
  cropped?: boolean;
}

export interface Colors2 {
  c0: string;
  c1: string;
}

export interface Content {
  type: string;
  media: Medium[];
  colors: Colors2;
  text: string;
}

export interface Tumblr {
  object_type: string;
  type: string;
  id: string;
  tumblelog_uuid: string;
  original_type: string;
  blog_name: string;
  blog: Blog;
  id_string: string;
  post_url: string;
  slug: string;
  date: string;
  timestamp: number;
  state: string;
  reblog_key: string;
  tags: string[];
  short_url: string;
  summary: string;
  should_open_in_legacy: boolean;
  recommended_source?: unknown;
  recommended_color?: unknown;
  followed: boolean;
  post_author: string;
  liked: boolean;
  note_count: number;
  content: Content[];
  layout: unknown[];
  trail?: { content: Content[] }[];
  can_like: boolean;
  can_reblog: boolean;
  can_send_in_message: boolean;
}
