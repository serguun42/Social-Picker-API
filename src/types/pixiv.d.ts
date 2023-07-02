export type PixivPreload = {
  timestamp: string;
  illust: { [illustId: string]: PostAkaIllust };
  user: { [userId: string]: User };
};

export type PixivAjax = {
  error: boolean;
  message: string;
  body: PostAkaIllust;
};

export type PostAkaIllust = {
  illustId: string;
  illustTitle: string;
  illustComment: string;
  id: string;
  title: string;
  description: string;
  illustType: number;
  createDate: string;
  uploadDate: string;
  restrict: number;
  xRestrict: number;
  sl: number;
  urls: Urls;
  tags: Tags;
  alt: string;
  storableTags: string[];
  userId: string;
  userName: string;
  userAccount: string;
  userIllusts: { [illustId: string]: UserIllust | null };
  likeData: boolean;
  width: number;
  height: number;
  pageCount: number;
  bookmarkCount: number;
  likeCount: number;
  commentCount: number;
  responseCount: number;
  viewCount: number;
  bookStyle: number;
  isHowto: boolean;
  isOriginal: boolean;
  imageResponseOutData: unknown[];
  imageResponseData: unknown[];
  imageResponseCount: number;
  pollData: unknown;
  seriesNavData: unknown;
  descriptionBoothId: unknown;
  descriptionYoutubeId: unknown;
  comicPromotion: unknown;
  fanboxPromotion: unknown;
  contestBanners: unknown[];
  isBookmarkable: boolean;
  bookmarkData: unknown;
  contestData: unknown;
  zoneConfig: ZoneConfig;
  extraData: { meta: Meta };
  titleCaptionTranslation: TitleCaptionTranslation3;
  isUnlisted: boolean;
  request: unknown;
  commentOff: number;
};

export type Urls = {
  mini: string;
  thumb: string;
  small: string;
  regular: string;
  original: string;
};

type Tags = {
  authorId: string;
  isLocked: boolean;
  tags: Tag[];
  writable: boolean;
};

type Tag = {
  tag: string;
  locked: boolean;
  deletable: boolean;
  userId: string;
  romaji: string;
  translation: { en: string };
  userName: string;
};

type UserIllust = {
  id: string;
  title: string;
  illustType: number;
  xRestrict: number;
  restrict: number;
  sl: number;
  url: string;
  description: string;
  tags: string[];
  userId: string;
  userName: string;
  width: number;
  height: number;
  pageCount: number;
  isBookmarkable: boolean;
  bookmarkData: unknown;
  alt: string;
  titleCaptionTranslation: TitleCaptionTranslation;
  createDate: string;
  updateDate: string;
  isUnlisted: boolean;
  isMasked: boolean;
};

type TitleCaptionTranslation = {
  workTitle: unknown;
  workCaption: unknown;
};

type ZoneConfig = {
  [zoneConfigType: string]: { url: string };
};

type Meta = {
  title: string;
  description: string;
  canonical: string;
  alternateLanguages: AlternateLanguages;
  descriptionHeader: string;
  ogp: Ogp;
  twitter: Twitter;
};

type AlternateLanguages = {
  ja: string;
  en: string;
};

type Ogp = {
  description: string;
  image: string;
  title: string;
  type: string;
};

type Twitter = {
  description: string;
  image: string;
  title: string;
  card: string;
};

type TitleCaptionTranslation3 = {
  workTitle: unknown;
  workCaption: unknown;
};

type User = {
  userId: string;
  name: string;
  image: string;
  imageBig: string;
  premium: boolean;
  isFollowed: boolean;
  isMypixiv: boolean;
  isBlocking: boolean;
  background: unknown;
  sketchLiveId: unknown;
  partial: number;
  acceptRequest: boolean;
  sketchLives: unknown[];
};

export type UgoiraMeta = {
  error: boolean;
  message: string;
  body: {
    src: string;
    originalSrc: string;
    mime_type: string;
    frames: {
      file: string;
      delay: number;
    }[];
  };
};
