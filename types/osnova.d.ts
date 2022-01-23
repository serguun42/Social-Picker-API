export interface Avatar {
	type: string;
	data: Media;
}

export interface Author {
	id: number;
	url: string;
	name: string;
	type: number;
	avatar: Avatar;
	avatar_url: string;
	is_online: boolean;
	is_verified: boolean;
	is_subscribed: boolean;
}

export interface Badge {
	type: string;
	text: string;
	background: string;
	color: string;
	border: string;
}

export interface AdditionalData {
	size: number;
	type: string;
	uuid: string;
}

export interface Size {
	width: number;
	height: number;
}

export interface Cover {
	additionalData: AdditionalData;
	size: Size;
	thumbnailUrl: string;
	type: number;
	url: string;
	size_simple: string;
}

export interface Likes {
	is_liked: number;
	count: number;
	summ: number;
	is_hidden: boolean;
}

export interface Subsite {
	id: number;
	url: string;
	type: number;
	name: string;
	description: string;
	avatar: Avatar;
	avatar_url: string;
	head_cover: string;
	is_verified: boolean;
	is_enable_writing: boolean;
	is_subscribed: boolean;
	is_subscribed_to_new_posts: boolean;
}

export interface EtcControls {
	edit_entry: boolean;
	unpublish_entry: boolean;
	pin_content: boolean;
}

export interface Media {
	uuid: string;
	width: number;
	height: number;
	size: number;
	type: string;
	color: string;
	hash: string;
	external_service: any[];
}

export interface Image {
	type: string;
	data: Media;
}

export interface Item {
	title: string;
	author: string;
	image: Image;
}

export interface BlockData {
	text: string;
	text_truncated: string;
	items: Item[];
	with_background?: boolean;
	with_border?: boolean;
}

export interface Block {
	type: string;
	data: BlockData;
	cover: boolean;
	anchor: string;
}

export interface CommentEditor {
	enabled: boolean;
}

export interface OsnovaPost {
	id: number;
	url: string;
	author: Author;
	badges: Badge[];
	commentsCount: number;
	commentsSeenCount?: any;
	favoritesCount: number;
	cover: Cover;
	date: number;
	dateRFC: string;
	date_favorite?: any;
	last_modification_date: number;
	hitsCount: number;
	intro: string;
	introInFeed?: any;
	isEnabledComments: boolean;
	isEnabledLikes: boolean;
	isFavorited: boolean;
	isRepost: boolean;
	likes: Likes;
	subsite: Subsite;
	similar: any[];
	title: string;
	type: number;
	commentatorsAvatars: string[];
	webviewUrl?: any;
	isPinned: boolean;
	canEdit: boolean;
	etcControls: EtcControls;
	highlight: string;
	blocks: Block[];
	subscribedToTreads: boolean;
	is_show_thanks: boolean;
	is_still_updating: boolean;
	is_filled_by_editors: boolean;
	isEditorial: boolean;
	audioUrl?: any;
	hotness: number;
	commentEditor: CommentEditor;
	summarize: string;
}
