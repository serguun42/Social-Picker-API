/** @typedef {{ externalUrl: string } & { filename: string, fileCallback: () => void, videoSource: string, audioSource: string }} CombinedVideoResult */
/**
 * @param {string} video
 * @param {string} audio
 * @returns {Promise<CombinedVideoResult>}
 */
declare function _exports(video: string, audio: string): Promise<CombinedVideoResult>;
export = _exports;
export type CombinedVideoResult = {
    externalUrl: string;
} & {
    filename: string;
    fileCallback: () => void;
    videoSource: string;
    audioSource: string;
};
