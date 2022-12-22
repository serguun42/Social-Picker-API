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
  imageResponseOutData: any[];
  imageResponseData: any[];
  imageResponseCount: number;
  pollData: any;
  seriesNavData: any;
  descriptionBoothId: any;
  descriptionYoutubeId: any;
  comicPromotion: any;
  fanboxPromotion: any;
  contestBanners: any[];
  isBookmarkable: boolean;
  bookmarkData: any;
  contestData: any;
  zoneConfig: ZoneConfig;
  extraData: { meta: Meta };
  titleCaptionTranslation: TitleCaptionTranslation3;
  isUnlisted: boolean;
  request: any;
  commentOff: number;
};

type Urls = {
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
  bookmarkData: any;
  alt: string;
  titleCaptionTranslation: TitleCaptionTranslation;
  createDate: string;
  updateDate: string;
  isUnlisted: boolean;
  isMasked: boolean;
};

type TitleCaptionTranslation = {
  workTitle: any;
  workCaption: any;
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
  workTitle: any;
  workCaption: any;
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
  background: any;
  sketchLiveId: any;
  partial: number;
  acceptRequest: boolean;
  sketchLives: any[];
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
