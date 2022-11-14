export type Media = {
  type: 'photo' | 'gif' | 'video' | 'audio';
  /** Link to default size external file */
  externalUrl: string;
  /** Link to original size external file */
  original?: string;
  otherSources?: { [otherSourceOriginKey: string]: string };
  /** File extension */
  filetype?: string;
  /** Combined local copy of file. Later front and API identify file by `"filehash"` */
  filename?: string;
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
