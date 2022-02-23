export = CombineVideo;
/** @typedef {{ externalUrl: string } & { filename: string, fileCallback: () => void, videoSource: string, audioSource: string }} CombinedVideoResult */
/**
 * @param {string} video
 * @param {string} audio
 * @returns {Promise<CombinedVideoResult>}
 */
declare function CombineVideo(video: string, audio: string): Promise<CombinedVideoResult>;
declare namespace CombineVideo {
    export { CombinedVideoResult };
}
type CombinedVideoResult = {
    externalUrl: string;
} & {
    filename: string;
    fileCallback: () => void;
    videoSource: string;
    audioSource: string;
};
