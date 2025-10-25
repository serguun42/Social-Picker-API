export interface PostEntity {
  id: number;
  url?: string;
  name: string;
  type: number;
  description: string;
  avatar: PostMedia;
  head_cover: string;
  is_online: boolean;
  is_verified: boolean;
  is_enable_writing: boolean;
  is_subscribed: boolean;
  is_subscribed_to_new_posts: boolean;
}

export interface PostBadge {
  type: string;
  text: string;
  background: string;
  color: string;
  border: string;
}

export interface PostCover {
  additionalData: {
    size: number;
    type: string;
    uuid: string;
  };
  size: {
    width: number;
    height: number;
  };
  thumbnailUrl: string;
  type: number;
  url: string;
  size_simple: string;
}

export interface PostLikes {
  is_liked: number;
  count: number;
  summ: number;
  is_hidden: boolean;
}

export interface PostExternalService {
  additional_data?: unknown[];
  id: string;
  name: 'coub' | 'youtube' | 'etc';
}

export interface PostVideo {
  type: 'video';
  data: {
    width: number;
    height: number;
    thumbnail: PostMedia;
    external_service: PostExternalService;
    time: number;
  };
}

export interface PostMediaData {
  uuid: string;
  width: number;
  height: number;
  size: number;
  type: 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif';
  color: string;
  hash: string;
  external_service: PostExternalService;
}

export interface PostMedia {
  type: string;
  data: PostMediaData;
}

export interface PostBlockMediaItem {
  title: string;
  author?: string;
  image: PostMedia;
}

export interface PostBlockTypeText {
  type: 'text';
  data: {
    text: string;
    text_truncated: string;
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeHeader {
  type: 'header';
  data: {
    text: string;
    style: string;
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeList {
  type: 'list';
  data: {
    type: 'UL';
    items: string[];
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeMedia {
  type: 'media';
  data: {
    items: PostBlockMediaItem[];
    with_background: boolean;
    with_border: boolean;
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeVideo {
  type: 'video';
  data: {
    video: PostVideo;
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeAudio {
  type: 'audio';
  data: {
    title: string;
    hash: string;
    image: PostMedia;
    audio: {
      type: 'audio';
      data: {
        uuid: string;
        filename: string;
        size: number;
        audio_info: {
          bitrate: number;
          duration: number;
          channel: string;
          framesCount: number;
          format: 'mp3';
          listens_count: number;
        };
      };
    };
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeIncut {
  type: 'incut';
  data: {
    text: string;
    text_size: string;
    type: 'centered';
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeNumber {
  type: 'number';
  data: {
    title: string;
    number: string;
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeQuote {
  type: 'quote';
  data: {
    image?: PostMedia;
    subline1?: string;
    subline2?: string;
    text: string;
    text_size: string;
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypePerson {
  type: 'person';
  data: {
    image?: PostMedia;
    title: string;
    description: string;
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeTweet {
  type: 'tweet';
  data: {
    media: boolean;
    conversation: boolean;
    title: string;
    markdown: string;
    tweet: {
      type: 'tweet';
      data: {
        tweet_data: import('./osnova-post-sub-tweet.js').Tweet;
        tweet_data_encoded: string;
        version: string;
      };
    };
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeTelegram {
  type: 'telegram';
  data: {
    title: string;
    markdown: string;
    telegram: {
      type: 'telegram';
      data: {
        tg_data: import('./osnova-post-sub-telegram.js').TelegramPost;
        tg_data_encoded: string;
      };
    };
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeInstagram {
  type: 'instagram';
  data: {
    title: string;
    markdown: string;
    instagram: {
      type: 'instagram';
      data: {
        box_data: {
          url: string;
        };
      };
    };
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeDelimiter {
  type: 'delimiter';
  data: object;
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeLink {
  type: 'link';
  data: {
    link: {
      type: 'link';
      data: {
        url: string;
        title: string;
        description: string;
        image?: PostMedia;
        v: 1;
      };
    };
  };
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export interface PostBlockTypeDefault {
  type: 'default';
  data: object;
  anchor: string;
  cover: boolean;
  hidden: boolean;
}

export type PostBlock =
  | PostBlockTypeText
  | PostBlockTypeHeader
  | PostBlockTypeList
  | PostBlockTypeMedia
  | PostBlockTypeVideo
  | PostBlockTypeAudio
  | PostBlockTypeIncut
  | PostBlockTypeNumber
  | PostBlockTypeQuote
  | PostBlockTypePerson
  | PostBlockTypeTweet
  | PostBlockTypeTelegram
  | PostBlockTypeInstagram
  | PostBlockTypeDelimiter
  | PostBlockTypeLink
  | PostBlockTypeDefault;

export interface PostVersion {
  id: number;
  url: string;
  author: PostEntity;
  badges: PostBadge[];
  commentsCount: number;
  commentsSeenCount?: unknown;
  favoritesCount: number;
  cover: PostCover;
  date: number;
  dateRFC: string;
  date_favorite?: unknown;
  last_modification_date: number;
  hitsCount: number;
  intro: string;
  introInFeed?: unknown;
  isEnabledComments: boolean;
  isEnabledLikes: boolean;
  isFavorited: boolean;
  isRepost: boolean;
  likes: PostLikes;
  subsite: PostEntity;
  similar: unknown[];
  title: string;
  type: number;
  commentatorsAvatars: string[];
  webviewUrl?: unknown;
  isPinned: boolean;
  highlight: string;
  blocks: PostBlock[];
  subscribedToTreads: boolean;
  is_show_thanks: boolean;
  is_still_updating: boolean;
  is_filled_by_editors: boolean;
  isEditorial: boolean;
  audioUrl?: unknown;
  hotness: number;
  commentEditor: {
    enabled: boolean;
  };
  summarize: string;
  co_author?: PostEntity;
  html: {
    layout: string;
    version: string;
  };
}

export default PostVersion;
