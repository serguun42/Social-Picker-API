export = CombineVideo;
/**
 * @param {string} video
 * @param {string} audio
 * @returns {Promise<{ url: string } | { filename: string, onDoneCallback: () => void }>}
 */
declare function CombineVideo(video: string, audio: string): Promise<{
    url: string;
} | {
    filename: string;
    onDoneCallback: () => void;
}>;
