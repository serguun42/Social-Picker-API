export interface YtDlpOutput {
  id: string;
  title: string;
  formats: Format[];
  thumbnails: Thumbnail[];
  thumbnail: string;
  description: string;
  uploader: string;
  uploader_id: string;
  uploader_url: string;
  channel_id: string;
  channel_url: string;
  duration: number;
  view_count: number;
  average_rating: any;
  age_limit: number;
  webpage_url: string;
  categories: string[];
  tags: string[];
  playable_in_embed: boolean;
  live_status: any;
  release_timestamp: any;
  automatic_captions: Captions;
  subtitles: Captions;
  comment_count: any;
  chapters: Chapter[];
  like_count: number;
  channel: string;
  channel_follower_count: number;
  upload_date: string;
  availability: string;
  original_url: string;
  webpage_url_basename: string;
  webpage_url_domain: string;
  extractor: string;
  extractor_key: string;
  playlist: any;
  playlist_index: any;
  display_id: string;
  fulltitle: string;
  duration_string: string;
  requested_subtitles: any;
  _has_drm: any;
  requested_formats: RequestedFormat[];
  format: string;
  format_id: string;
  ext: string;
  protocol: string;
  language: any;
  format_note: string;
  filesize_approx: number;
  tbr: number;
  width: number;
  height: number;
  resolution: string;
  fps: number;
  dynamic_range: string;
  vcodec: string;
  vbr: number;
  stretched_ratio: any;
  acodec: string;
  abr: number;
  asr: number;
  audio_channels: number;
  epoch: number;
  _filename: string;
  filename: string;
  urls: string;
  _type: string;
  _version: Version;
}

export interface Format {
  format_id: string;
  format_note: string;
  ext: string;
  protocol: string;
  acodec: string;
  vcodec: string;
  url: string;
  width?: number;
  height?: number;
  fps?: number;
  rows?: number;
  columns?: number;
  fragments?: Fragment[];
  audio_ext: string;
  video_ext: string;
  format: string;
  resolution: string;
  http_headers: HttpHeaders;
  asr?: number;
  filesize?: number;
  source_preference?: number;
  audio_channels?: number;
  quality?: number;
  has_drm?: boolean;
  tbr?: number;
  language?: string;
  language_preference?: number;
  preference?: number;
  dynamic_range?: string;
  abr?: number;
  downloader_options?: DownloaderOptions;
  container?: string;
  vbr?: number;
  filesize_approx?: number;
}

export interface Fragment {
  url: string;
  duration: number;
}

export interface HttpHeaders {
  'User-Agent': string;
  Accept: string;
  'Accept-Language': string;
  'Sec-Fetch-Mode': string;
}

export interface DownloaderOptions {
  http_chunk_size: number;
}

export interface Thumbnail {
  url: string;
  preference: number;
  id: string;
  height?: number;
  width?: number;
  resolution?: string;
}

export interface Captions {
  [language: string]: {
    ext: string;
    url: string;
    name: string;
  }[];
}

export interface Chapter {
  start_time: number;
  title: string;
  end_time: number;
}

export interface RequestedFormat {
  asr?: number;
  filesize: number;
  format_id: string;
  format_note: string;
  source_preference: number;
  fps?: number;
  audio_channels?: number;
  height?: number;
  quality: number;
  has_drm: boolean;
  tbr: number;
  url: string;
  width?: number;
  language: string;
  language_preference: number;
  preference: any;
  ext: string;
  vcodec: string;
  acodec: string;
  dynamic_range?: string;
  vbr?: number;
  downloader_options: DownloaderOptions;
  container: string;
  protocol: string;
  video_ext: string;
  audio_ext: string;
  format: string;
  resolution: string;
  http_headers: HttpHeaders;
  abr?: number;
}

export interface Version {
  version: string;
  current_git_head: any;
  release_git_head: string;
  repository: string;
}

export default YtDlpOutput;
