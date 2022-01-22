const NodeFetch = require("node-fetch").default;
const ffmpeg = require("ffmpeg");
const pathResolve = require("path").resolve;
const { promisify } = require("util");
const { pipeline } = require("stream");
const streamPipeline = promisify(pipeline);
const { createWriteStream: fsCreateWriteStream, unlink } = require("fs");
const fsUnlink = promisify(unlink);
const crypto = require("crypto");
const LogMessageOrError = require("./log");

const TEMP_FOLDER = process.env["TEMP"] || "/tmp/";


/**
 * @param {string} video
 * @param {string} audio
 * @returns {Promise<{ url: string } | { filename: string, onDoneCallback: () => void }>}
 */
const CombineVideo = (video, audio) => {
	if (!video) return Promise.reject("No video URL");
	if (!audio) return Promise.resolve({ url: video });


	const videoBaseFilename = `socialpicker_${
		crypto.createHash("sha256").update(`${video}_${Date.now()}`).digest("hex")
	}`;
	const videoFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_video`);
	const videoFiletype = video.replace(/\?.*$/, "").match(/\.(\w+)$/)?.[1] || "mp4";
	const audioFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_audio`);
	const outFilename = pathResolve(TEMP_FOLDER, `${videoBaseFilename}_out.${videoFiletype}`);


	const LocalDeleteTempFiles = () => {
		fsUnlink(videoFilename).catch(() => {});
		fsUnlink(audioFilename).catch(() => {});
		fsUnlink(outFilename).catch(() => {});
	};


	return NodeFetch(video).then((response) => {
		if (response.status !== 200)
			return Promise.reject(new Error(`Response status on video (${video}) is ${response.status}`));

		return streamPipeline(response.body, fsCreateWriteStream(videoFilename));
	})
	.then(() => NodeFetch(audio))
	.then((response) => {
		if (response.status !== 200)
			return Promise.reject(new Error(`Response status on audio (${audio}) is ${response.status}`));

		return streamPipeline(response.body, fsCreateWriteStream(audioFilename));
	})
	.then(() => new ffmpeg(videoFilename))
	.then((ffmpegVideo) => new Promise((resolve, reject) => {
		ffmpegVideo.addInput(audioFilename);
		ffmpegVideo.addCommand("-c:v", "copy");
		ffmpegVideo.addCommand("-c:a", "aac");
		ffmpegVideo.addCommand("-qscale", "0");
		ffmpegVideo.save(outFilename, (e) => {
			if (e) return reject(e);

			resolve({ filename: outFilename, onDoneCallback: LocalDeleteTempFiles });
		});
	})).catch((e) => {
		LogMessageOrError(e);
		LocalDeleteTempFiles();
		return Promise.resolve({ url: video });
	});
};

module.exports = CombineVideo;
