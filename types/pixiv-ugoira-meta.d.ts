export type UgoiraMeta = {
  error: boolean;
  message: string;
  body: {
    src: string;
    originalSrc: string;
    mime_type: string;
    frames: Frame[];
  };
};

export type Frame = {
  file: string;
  delay: number;
};

export default UgoiraMeta;
