export interface TelegramPost {
  id: number;
  url: string;
  version: number;
  text: string;
  author: {
    name: string;
    avatar_url: string;
    url: string;
  };
  photos: {
    width: number;
    height: number;
    /** Link to Osnova CDN */
    leonardo_url: string;
  }[];
  videos: {
    width: number;
    height: number;
    ratio: number;
    /** Link to Osnova CDN */
    src: string;
    /** Link to Osnova CDN */
    thumbnail_url: string;
  }[];
  views: string;
  datetime: number;
  is_supported: boolean;
  forwarded_from: any[];
  reply_to: any[];
}
