export type TwitterV2 = {
	data: Data;
	includes: Includes;
};

export type Data = {
	attachments: Attachments;
	entities: Entities;
	author_id: string;
	text: string;
	id: string;
	edit_history_tweet_ids: string[];
};

export type Attachments = {
	media_keys: string[];
};

export type Entities = {
	hashtags: HashtagEntity[];
	urls: UrlEntity[];
};

export type HashtagEntity = {
	start: number;
	end: number;
	tag: string;
};

export type UrlEntity = {
	start: number;
	end: number;
	url: string;
	expanded_url: string;
	display_url: string;
	media_key?: string;
};

export type Includes = {
	media: Medium[];
	users: User[];
};

type MediumPhoto = {
	media_key: string;
	type: "photo";
	width: number;
	height: number;
	url: string;
};

type MediumVideo = {
	media_key: string;
	type: "video" | "animated_gif";
	width: number;
	height: number;
	variants: MediaVariant[];
};

export type Medium = MediumPhoto | MediumVideo;

export type MediaVariant = {
	content_type: string;
	url: string;
	bit_rate?: number;
};

export type User = {
	id: string;
	name: string;
	username: string;
};
