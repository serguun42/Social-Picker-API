export type YoutubeDLFormat = {
	/** Direct link to _googlevideo.com_ */
	url: string;

	/** Inner Youtube's format id */
	format_id: string;
	/** `"tiny"`, `"144p"`, `"1080p"`, `"2160p"`, etc. */
	format_note: string;
	/** Combination of fields `format_id` and `format_note` */
	format: string;
	/** `"https"`, `"http"`, `"m3u8"`, etc */
	protocol: string;

	/** From `0` on lowest (144p and bad audio) to `7` on highest (2160p) */
	quality: number;

	/** Name of the container format */
	container: string;
	/** File extension */
	ext: string;
	/** Name of the video codec in use. `"none"` if no video */
	vcodec: string;
	/** Name of the audio codec in use. `"none"` if no audio */
	acodec: string;

	/** The number of bytes, if known in advance */
	filesize?: number;
	fps?: number;

	/** Average bitrate of audio and video in KBit/s */
	tbr: number;
	/** Average video bitrate in KBit/s */
	vbr?: number;
	/** Width of the video, if known */
	width?: number;
	/** Height of the video, if known */
	height?: number;
	/** Audio sampling rate in Hertz */
	asr?: number;
	/** Average audio bitrate in KBit/s */
	abr: number;
}

export type YoutubeDLOutput = {
	/** Name of user/channel who uploaded video */
	uploader: string;
	/** Link to uploader channel (`"https://www.youtube.com/user/username"`) */
	uploader_url: string;
	/** Video ID */
	id: string;
	/** Link to page on Youtube (`"https://www.youtube.com/watch?v=dQw4w9WgXcQ"`) */
	webpage_url: string;
	/** Video name provided by uploader */
	title: string;
	/** Whole video description provided by uploader */
	description: string;
	/** Link to thumbnail picture */
	thumbnail: string;

	formats: YoutubeDLFormat[];
}
