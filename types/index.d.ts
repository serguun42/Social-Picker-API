export type Media = {
	type: "gif" | "video" | "photo";
	externalUrl: string;
	original?: string;
	filename?: string;
	otherSources?: { [otherSourceOriginKey: string]: string };
	/** Call it when done */
	fileCallback?: () => void;
};

export type SocialPost = {
	caption: string;
	author: string;
	authorURL: string;
	postURL: string;
	medias: Media[];
}
