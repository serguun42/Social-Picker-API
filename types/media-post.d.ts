export type Media = {
  type: 'photo' | 'gif' | 'video' | 'audio';
  externalUrl: string;
  original?: string;
  /** Combined local copy of file. Later front and API identify file by `"filehash"` */
  filename?: string;
  /** File extension */
  filetype?: string;
  otherSources?: { [otherSourceOriginKey: string]: string };
  /** Call it when done */
  fileCallback?: () => void;
  /** Media description e.g. youtube video quality or image size */
  description?: string;
  /** Media total filesize if known (in bytes) */
  filesize?: number;
};

export type SocialPost = {
  caption: string;
  author: string;
  authorURL: string;
  postURL: string;
  medias: Media[];
};

export type VideoAudioMerged =
  | { externalUrl: string }
  | {
      filename: string;
      fileCallback: () => void;
      videoSource: string;
      audioSource: string;
    };

export type UgoiraBuilt = {
  /**
   * @constant
   * @default "video"
   */
  type: string;
  /** Link to Ugoira zip */
  externalUrl: string;
  /** Link to Ugoira zip */
  original: string;
  filename: string;
  /**
   * @constant
   * @default "mp4"
   */
  filetype: string;
  fileCallback: () => void;
};
