const NodeFetch = require("node-fetch").default;
const TwitterLite = require("twitter-lite");
const TumblrJS = require("tumblr.js");
const YoutubeDLExec = require("youtube-dl-exec");
const parseHTML = require("node-html-parser").parse;
const CombineVideo = require("../util/combine-video");
const { SafeParseURL, ParseQuery } = require("../util/urls");
const LogMessageOrError = require("../util/log");

const DEV = require("../util/is-dev");

const {
	TWITTER_OAUTH,
	INSTAGRAM_COOKIE,
	TUMBLR_OAUTH
} = (DEV ? require("../config/tokens.dev.json") : require("../config/tokens.json"));

const { CUSTOM_IMG_VIEWER_SERVICE } = (DEV ? require("../config/service.dev.json") : require("../config/service.json"));


/** @type {import("twitter-lite").default} */
const TwitterInstance = new TwitterLite(TWITTER_OAUTH);

const TumblrClient = TumblrJS.createClient({
	credentials: TUMBLR_OAUTH,
	returnPromises: true
});



/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Twitter = (url) => {
	const statusID = url.pathname.match(/^(?:\/[\w_]+)?\/status(?:es)?\/(\d+)/)?.[1];

	if (!statusID) return Promise.resolve({});


	return TwitterInstance.get("statuses/show", {
		id: statusID,
		tweet_mode: "extended"
	})
	.then(/** @param {import("../types/tweet").Tweet} tweet */ (tweet) => {
		const medias = tweet.extended_entities?.media;
		if (!medias?.length) return Promise.resolve({});

		let sendingMessageText = tweet.full_text || "";

		tweet.entities?.urls?.forEach((link) =>
			sendingMessageText = sendingMessageText.replace(new RegExp(link.url, "gi"), link.expanded_url)
		);

		sendingMessageText = sendingMessageText
								.replace(/\b(http(s)?\:\/\/)?t.co\/[\w\d_]+\b$/gi, "")
								.replace(/(\s)+/gi, "$1")
								.trim();


		/** @type {import("../types").SocialPost} */
		const socialPost = {
			caption: sendingMessageText,
			postURL: url.href,
			author: tweet.user?.name,
			authorURL: `https://twitter.com/${tweet.user?.screen_name}`
		}


		if (medias[0]["type"] === "animated_gif") {
			const variants = medias[0]["video_info"]["variants"].filter(i => (!!i && i.hasOwnProperty("bitrate")));

			if (!variants || !variants.length) return false;

			let best = variants[0];

			variants.forEach((variant) => {
				if (variant.bitrate > best.bitrate)
					best = variant;
			});

			socialPost.medias = [
				{
					type: "gif",
					externalUrl: best["url"]
				}
			];
		} else if (medias[0]["type"] === "video") {
			const variants = medias[0]["video_info"]["variants"].filter(i => (!!i && i.hasOwnProperty("bitrate")));

			if (!variants || !variants.length) return false;

			let best = variants[0];

			variants.forEach((variant) => {
				if (variant.bitrate > best.bitrate)
					best = variant;
			});

			socialPost.medias = [
				{
					type: "video",
					externalUrl: best["url"]
				}
			];
		} else {
			socialPost.medias = medias.map((media) => {
				if (media["type"] === "photo")
					return { type: "photo", externalUrl: media["media_url_https"] + ":orig" };

				return false;
			}).filter(media => !!media);
		}


		return Promise.resolve(socialPost);
	});
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const TwitterImg = (url) => {
	const format = ParseQuery(url.query)?.format || "jpg",
		  mediaPathname = url.pathname.replace(/\:[\w\d]+$/, "").replace(/\.[\w\d]+$/, "");

	return Promise.resolve({
		author: "",
		authorURL: "",
		caption: "",
		postURL: encodeURI(`https://pbs.twimg.com${mediaPathname}.${format}`),
		medias: [
			{
				type: "photo",
				externalUrl: encodeURI(`https://pbs.twimg.com${mediaPathname}.${format}`),
				original: encodeURI(`https://pbs.twimg.com${mediaPathname}.${format}:orig`)
			}
		]
	});
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Instagram = (url) => {
	const PATH_REGEXP = /^\/p\/([\w\_\-]+)(\/)?$/i;
	if (!PATH_REGEXP.test(url.pathname)) return;


	return NodeFetch(`https://${url.hostname}${url.pathname}?__a=1`, {
		"headers": {
			"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
			"accept-language": "en-US,en;q=0.9,ru;q=0.8",
			"sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
			"sec-ch-ua-mobile": "?0",
			"sec-fetch-dest": "document",
			"sec-fetch-mode": "navigate",
			"sec-fetch-site": "none",
			"sec-fetch-user": "?1",
			"upgrade-insecure-requests": "1",
			"cookie": INSTAGRAM_COOKIE
		},
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": null,
		"method": "GET",
		"mode": "cors"
	})
	.then((res) => {
		if (res.status == 200)
			return res.json();
		else
			return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
	})
	.then((graphData) => {
		const post = graphData?.["items"]?.[0];

		if (!post) return Promise.reject(new Error(`No post in... post: https://${url.hostname}${url.pathname}`));


		/** @type {import("../types").SocialPost} */
		const socialPost = {
			caption: post?.["caption"]?.["text"] || "",
			postURL: `https://instagram.com${url.pathname}`,
			author: post?.["user"]?.["username"],
			authorURL: `https://instagram.com/${post?.["user"]?.["username"]}`
		};


		const singleVideo = post["video_versions"];
		const singleImage = post["image_versions2"]?.["candidates"];
		const multipleMedia = post["carousel_media"];


		if (singleVideo) {
			socialPost.medias = [{
				type: "video",
				externalUrl: singleVideo.sort((prev, next) => next.width - prev.width)?.[0]?.["url"]
			}];
		} else if (singleImage) {
			socialPost.medias = [{
				type: "photo",
				externalUrl: singleImage.sort((prev, next) => next.width - prev.width)?.[0]?.["url"]
			}];
		} else if (multipleMedia) {
			socialPost.medias = multipleMedia.map(/** @returns {import("../types").Media} */ (media) => {
				if (!media) return null;

				if (media["video_versions"])
					return {
						type: "video",
						externalUrl: media["video_versions"]?.pop()?.["url"]
					};


				const candidates = media?.["image_versions2"]?.["candidates"];

				return {
					type: "photo",
					externalUrl: candidates.sort((prev, next) => next.width - prev.width)?.[0]?.["url"]
				};
			}).filter((media) => !!media);
		}


		return Promise.resolve(socialPost);
	});
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Pixiv = (url) => {
	const CHECK_REGEXP = /http(s)?\:\/\/(www\.)?pixiv\.net\/([\w]{2}\/)?artworks\/(\d+)/i;

	let pixivID = "";

	if (CHECK_REGEXP.test(url.href)) {
		pixivID = url.href.match(CHECK_REGEXP)[4];
	} else if (ParseQuery(url.search)["illust_id"])
		pixivID = ParseQuery(url.search)["illust_id"];

	if (!pixivID) return Promise.resolve({});


	const postURL = `https://www.pixiv.net/en/artworks/${pixivID}`;

	return NodeFetch(postURL).then((res) => {
		if (res.status == 200)
			return res.text();
		else
			return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${postURL}`));
	}).then((rawPixivHTML) => {
		let data;
		try {
			rawPixivHTML = rawPixivHTML
										.split(`id="meta-preload-data"`)[1]
										.split("</head")[0]
										.trim()
										.replace(/^content\=('|")/i, "")
										.split(/('|")>/)[0]
										.replace(/('|")>$/i, "")
										.trim();

			data = JSON.parse(rawPixivHTML);
		} catch (e) {
			return Promise.reject("Cannot parse data from Pixiv", e);
		}


		const post = data?.["illust"]?.[Object.keys(data["illust"])[0]];

		/** @type {number} */
		const sourcesAmount = post?.["pageCount"];

		/** @type {import("../types").Media[]} */
		const medias = new Array();

		if (!post) return Promise.resolve(new Error("No Pivix post", rawPixivHTML));


		for (let i = 0; i < sourcesAmount; i++) {
			let origFilename = post["urls"]["original"],
				origBasename = origFilename.replace(/\d+\.([\w\d]+)$/i, ""),
				origFiletype = origFilename.match(/\.([\w\d]+)$/i);

			if (origFiletype && origFiletype[1])
				origFiletype = origFiletype[1];
			else
				origFiletype = "png";


			const masterFilename = post["urls"]["regular"];

			medias.push({
				type: "photo",
				externalUrl: CUSTOM_IMG_VIEWER_SERVICE
					.replace(/__LINK__/, encodeURI(masterFilename.replace(/\d+(_master\d+\.[\w\d]+$)/i, i + "$1")))
					.replace(/__HEADERS__/, encodeURIComponent(
						JSON.stringify({ referer: "https://www.pixiv.net/" })
					)),
				original: CUSTOM_IMG_VIEWER_SERVICE
					.replace(/__LINK__/, encodeURI(origBasename + i + "." + origFiletype))
					.replace(/__HEADERS__/, encodeURIComponent(
						JSON.stringify({ referer: "https://www.pixiv.net/" })
					))
			});
		}



		return Promise.resolve({
			caption: post["title"] || post["illustTitle"] || post["description"] || post["illustComment"],
			author: post["userName"],
			authorURL: "https://www.pixiv.net/en/users/" + post["userId"],
			postURL,
			medias
		});
	});
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Reddit = (url) => {
	if (!url.pathname) return;

	const REDDIT_POST_REGEXP = /^(\/r\/[\w\d\-\._]+\/comments\/[\w\d\-\.]+)(\/)?/i,
		  match = url.pathname.match(REDDIT_POST_REGEXP);

	if (!(match && match[1])) return;

	const postJSON = `https://www.reddit.com${match[1]}.json`,
		  postURL = `https://www.reddit.com${match[1]}${match[2] || ""}`;


	const DEFAULT_REDDIT_HEADERS = {
		"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
		"Accept-Encoding": "gzip, deflate, br",
		"Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
		"Cache-Control": "no-cache",
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36",
		"Origin": "https://www.reddit.com",
		"Pragma": "no-cache",
		"referer": "https://www.reddit.com/"
	};


	return new Promise((redditResolve, redditReject) => {
		NodeFetch(postJSON, { headers: DEFAULT_REDDIT_HEADERS }).then((res) => {
			if (res.status == 200)
				return res.json();
			else
				return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
		}).then((redditPostData) => {
			const post = redditPostData[0]?.data?.children?.[0]?.data,
				  caption = post?.title,
				  author = post?.author,
				  authorURL = `https://www.reddit.com/u/${author || "me"}`,
				  isVideo = post?.is_video,
				  isGallery = post?.is_gallery;


			if (!post) return Promise.reject(new Error("No post in .json-data"));


			if (isVideo) {
				const video = post?.secure_media?.reddit_video?.fallback_url,
					  isGif = post?.secure_media?.reddit_video?.is_gif;

				if (!video) return Promise.reject(new Error("Reddit no video"));


				return new Promise((resolve) => {
					if (isGif) return resolve({ externalUrl: video });

					if (!post?.secure_media?.reddit_video?.hls_url)
						return resolve({ externalUrl: video });

					const hslPlaylist = post.secure_media.reddit_video.hls_url;

					return NodeFetch(hslPlaylist, {
						headers: {
							...DEFAULT_REDDIT_HEADERS,
							host: SafeParseURL(hslPlaylist).hostname
						}
					}).then((response) => {
						if (response.status == 200)
							return response.text();
						else
							return Promise.reject(`Response status from Reddit ${response.status}`);
					}).then((hslFile) => {
						const hslPlaylistLines = hslFile.split("\t"),
							  audioPlaylistLocation = hslPlaylistLines.filter((line) => /TYPE=AUDIO/i.test(line)).pop()?.match(/URI="([^"]+)"/)?.[1] || "";

						return NodeFetch(hslPlaylist.replace(/\/[^\/]+$/, `/${audioPlaylistLocation}`), {
							headers: {
								...DEFAULT_REDDIT_HEADERS,
								host: SafeParseURL(hslPlaylist).hostname
							}
						});
					}).then((response) => {
						if (response.status == 200)
							return response.text();
						else
							return Promise.reject(`Response status from Reddit ${response.status}`);
					}).then((audioPlaylistFile) => {
						const audioFilename = audioPlaylistFile.split("\n").filter((line) =>
							line && !/^#/.test(line)
						).pop() || "";
						const audio = audioFilename.trim() ? hslPlaylist.replace(/\/[^\/]+$/, `/${audioFilename}`) : "";

						if (!audio) return resolve({ externalUrl: video });

						CombineVideo(video, audio)
						.then((videoResult) => resolve(videoResult))
						.catch(() => resolve({ externalUrl: video }));
					}).catch(() => resolve({ externalUrl: video }));
				}).then(/** @param {import("../util/combine-video").CombinedVideoResult} videoResult */ (videoResult) => {
						const {
							externalUrl,
							filename,
							fileCallback,
							videoSource,
							audioSource
						} = videoResult;

						/** @type {import("../types").Media[]} */
						const videoSources = [];

						if (filename)
							videoSources.push({
								type: (isGif && !audioSource) ? "gif" : "video",
								otherSources: {
									audioSource,
									videoSource
								},
								filename,
								filetype: SafeParseURL(videoSource).pathname?.split(".").pop(),
								fileCallback
							});
						else if (externalUrl)
							videoSources.push({
								externalUrl,
								type: isGif ? "gif" : "video"
							});

						return redditResolve({
							author,
							authorURL,
							postURL,
							caption,
							medias: videoSources
						});
					}
				);
			} else {
				if (isGallery) {
					/** @type {import("../types").Media[]} */
					const galleryMedias = (post?.gallery_data?.items || [])
						.map(/** @return {import("../types").Media} */ (item) => {
							const isGif = !!post?.media_metadata?.[item.media_id]?.s?.gif;

							if (isGif)
								return {
									type: "gif",
									externalUrl: post?.media_metadata?.[item.media_id]?.s?.gif
								};

							try {
								const previewUrl = SafeParseURL(post?.media_metadata?.[item.media_id]?.s?.u);

								return {
									type: "photo",
									externalUrl: `https://${previewUrl.hostname.replace(/^preview\./i, "i.")}${previewUrl.pathname}`
								};
							} catch (e) {
								return false;
							}
						})
						.filter((galleryMedia) => !!galleryMedia);

					redditResolve({
						author,
						authorURL,
						postURL,
						caption,
						medias: galleryMedias
					});
				} else {
					const imageURL = (post?.url || post?.url_overridden_by_dest);
					const isGif = /\.gif$/i.test(imageURL);

					redditResolve({
						author,
						authorURL,
						postURL,
						caption,
						medias: imageURL ? [{
							type: isGif ? "gif" : "photo",
							externalUrl: imageURL
						}] : []
					});
				}
			}
		}).catch(redditReject);
	});
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Tumblr = (url) => {
	if (!(url instanceof URL)) url = new URL(url);

	const blogID = url.hostname.replace(/\.tumblr\.(com|co\.\w+|org)$/i, ""),
		  postID = url.pathname.match(/^\/posts?\/(\d+)/i)?.[1];

	if (!blogID || !postID) return;


	const API_PATH_BASE = `/v2/blog/__BLOG_ID__/posts/__POST_ID__`,
		  fetchingAPIPath = API_PATH_BASE.replace(/__BLOG_ID__/g, blogID).replace(/__POST_ID__/g, postID);

	return TumblrClient.getRequest(fetchingAPIPath, {})
	.then(/** @param {import("../types/tumblr").Tumblr} tumblr */ (tumblr) => {
		const content = tumblr.content?.length ? tumblr.content : tumblr.trail?.[0]?.content;

		if (!content) return Promise.reject(new Error(`No content in tumblr: ${url.pathname}`));


		/** @type {import("../types").Media[]} */
		const medias = content.filter((block) => block.type === "image").map((image) => {
			if (!image.media) return null;

			return image.media.sort((prev, next) => next.width - prev.width)?.[0];
		}).filter((image) => !!image).map((image) => ({
			type: "photo",
			externalUrl: image.url
		}));

		if (!medias?.length) return Promise.reject(new Error(`No medias in tumblr: ${url.pathname}`));


		const caption = content.filter((block) => block.type === "text").map((text) => text?.text || "").join("\n\n");


		/** @type {import("../types").SocialPost} */
		const fineTumblrSocialPost = {
			author: blogID,
			authorURL: `https://${blogID}.tumblr.com`,
			caption: caption || "",
			medias,
			postURL: `https://${blogID}.tumblr.com/post/${postID}`
		};

		return Promise.resolve(fineTumblrSocialPost);
	});
};

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Danbooru = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((danbooruPage) => {
	/** @type {import("../types").SocialPost} */
	const socialPost = {
		author: "",
		authorURL: "",
		caption: "",
		postURL: url.href
	};

	try {
		const parsedHTML = parseHTML(danbooruPage);

		const sizeAnchor = parsedHTML.querySelector("#post-info-size > a");
		if (!sizeAnchor) return Promise.reject(new Error("Danbooru no <sizeAnchor>"));

		const pictureURL = sizeAnchor.getAttribute("href");

		socialPost.medias = [{
			type: "photo",
			externalUrl: pictureURL
		}];


		const uploaderAnchor = parsedHTML.querySelector("#post-info-uploader > a");
		if (uploaderAnchor) {
			socialPost.author = uploaderAnchor.getAttribute("data-user-name") || "";
			socialPost.authorURL = new URL(uploaderAnchor.getAttribute("href") || "", url.origin);
		}


		return Promise.resolve(socialPost);
	} catch (error) {
		return Promise.reject(error);
	}
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Gelbooru = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((gelbooruPage) => {
	let source = "";

	try {
		source = gelbooruPage
							.split("</head")[0]
							.match(/<meta\s+(name|property)="og\:image"\s+content="([^"]+)"/i);

		if (source) source = source[2];
	} catch (e) {
		return Promise.reject(new Error(["Error on parsing Gelbooru", url.href, e]));
	}

	if (!source) return Promise.reject(new Error(["No Gelbooru source", url.href]));

	return Promise.resolve({
		author: "",
		authorURL: "",
		postURL: url.href,
		caption: "",
		medias: [{
			type: "photo",
			externalUrl: source
		}]
	});
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Konachan = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((konachanPage) => {
	let source = "";

	try {
		source = konachanPage
							.split("<body")[1]
							.match(/<a(\s+[\w\d\-]+\="([^"]+)")*\s+href="([^"]+)"(\s+[\w\d\-]+\="([^"]+)")*\s+id="highres"(\s+[\w\d\-]+\="([^"]+)")*/i);

		if (source) source = source[3];
	} catch (e) {
		return Promise.reject(new Error(["Error on parsing Konachan", url.href, e]));
	}

	if (!source) return Promise.reject(new Error(["No Konachan source", url.href]));

	return Promise.resolve({
		author: "",
		authorURL: "",
		postURL: url.href,
		caption: "",
		medias: [{
			type: "photo",
			externalUrl: source
		}]
	});
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Yandere = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((yanderePage) => {
	let source = "";

	try {
		source = yanderePage
							.split("<body")[1]
							.match(/<a\s+class="[^"]+"\s+id="highres"\s+href="([^"]+)"/i);

		if (source) source = source[1];
	} catch (e) {
		return Promise.reject(new Error(["Error on parsing Yandere", url.href, e]));
	}

	if (!source) return Promise.reject(new Error(["No Yandere source", url.href]));

	return Promise.resolve({
		author: "",
		authorURL: "",
		postURL: url.href,
		caption: "",
		medias: [{
			type: "photo",
			externalUrl: source
		}]
	});
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Eshuushuu = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((eshuushuuPage) => {
	let source = "";

	try {
		source = eshuushuuPage
							.split("<body")[1]
							.match(/<a\s+class="thumb_image"\s+href="([^"]+)"/i);

		if (source && source[1]) source = "https://e-shuushuu.net/" + source[1].replace(/\/\//g, "/").replace(/^\//g, "");
	} catch (e) {
		return Promise.reject(new Error(["Error on parsing Eshuushuu", url.href, e]));
	}

	if (!source) return Promise.reject(new Error(["No Eshuushuu source", url.href]));

	return Promise.resolve({
		author: "",
		authorURL: "",
		postURL: url.href,
		caption: "",
		medias: [{
			type: "photo",
			externalUrl: source
		}]
	});
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Sankaku = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((sankakuPage) => {
	let source = "";

	try {
		source = sankakuPage
							.split("<body")[1]
							.match(/<a\s+href="([^"]+)"\s+id=(")?highres/i);

		if (source && source[1]) source = source[1].replace(/&amp;/g, "&");
	} catch (e) {
		return Promise.reject(new Error(["Error on parsing Sankaku", url.href, e]));
	}

	if (!source) return Promise.reject(new Error(["No Sankaku source", url.href]));
	if (source.slice(0, 6) !== "https:") source = "https:" + source

	return Promise.resolve({
		author: "",
		authorURL: "",
		postURL: url.href,
		caption: "",
		medias: [{
			type: "photo",
			externalUrl: source
		}]
	});
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Zerochan = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((zerochanPage) => {
	let source = "";

	try {
		source = zerochanPage
							.split("</head")[0]
							.match(/<meta\s+(name|property)="og\:image"\s+content="([^"]+)"/i);

		if (source) source = source[2];

		if (!source) {
			source = danbooruPage
								.split("</head")[0]
								.match(/<meta\s+(name|property)="twitter\:image"\s+content="([^"]+)"/i);

			if (source) source = source[2];
		}
	} catch (e) {
		return Promise.reject(new Error(["Error on parsing Zerochan", url.href, e]));
	}

	if (!source) return Promise.reject(new Error(["No Zerochan source", url.href]));


	let sourceBasename = source.replace(/\.[\w\d]+$/, ""),
		basenameMatch = zerochanPage.match(new RegExp(sourceBasename + ".[\\w\\d]+", "gi"));

	if (basenameMatch && basenameMatch.pop) source = basenameMatch.pop();

	return Promise.resolve({
		author: "",
		authorURL: "",
		postURL: url.href,
		caption: "",
		medias: [{
			type: "photo",
			externalUrl: source
		}]
	});
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const AnimePictures = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((animePicturesPage) => {
	let source = "";

	try {
		source = animePicturesPage
							.split("<body")[1]
							.match(/<a\s+href="([^"]+)"\s+title="[^"]+"\s+itemprop="contentURL"/i);

		if (source && source[1]) source = source[1];
	} catch (e) {
		return Promise.reject(new Error(["Error on parsing AnimePictures", url.href, e]));
	}

	if (!source) return Promise.reject(new Error(["No AnimePictures source", url.href]));

	const imgLinkURL = SafeParseURL(source);

	return Promise.resolve({
		author: "",
		authorURL: "",
		postURL: url.href,
		caption: "",
		medias: [{
			type: "photo",
			externalUrl: new URL(imgLinkURL.pathname + imgLinkURL.search, url.origin)
		}]
	});
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const KemonoParty = (url) => NodeFetch(url.href)
.then((res) => {
	if (res.status == 200)
		return res.text();
	else
		return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
}).then((kemonoPartyPage) => {
	/** @type {import("../types").SocialPost} */
	const socialPost = {
		author: "",
		authorURL: "",
		caption: "",
		postURL: url.href,
		medias: []
	};

	try {
		const parsedHTML = parseHTML(kemonoPartyPage);
		const filesAnchors = parsedHTML.querySelectorAll(".post__thumbnail > .fileThumb");

		if (!(filesAnchors instanceof Array)) throw new Error("No array with files");

		filesAnchors.slice(1).forEach((fileAnchor) => {
			/** @type {import("../types").Media} */
			const media = {
				type: "photo"
			};

			const fullsizeURL = fileAnchor.getAttribute("href");
			if (fullsizeURL)
				media.original = new URL(fullsizeURL, url.origin);

			const thumbnailImage = fileAnchor.querySelector("img");
			if (thumbnailImage)
				media.externalUrl = new URL(thumbnailImage.getAttribute("src"), url.origin);

			socialPost.medias.push(media);
		});


		const usernameAnchor = parsedHTML.querySelector(".post__user-name");
		if (usernameAnchor) {
			socialPost.author = usernameAnchor.innerText?.trim() || "";
			socialPost.authorURL = new URL(usernameAnchor.getAttribute("href"), url.origin);
		}


		const postTitleHeader = parsedHTML.querySelector(".post__title");
		if (postTitleHeader)
			socialPost.caption = postTitleHeader.innerText?.trim() || "";


		return Promise.resolve(socialPost);
	} catch (error) {
		return Promise.reject(error);
	}
});

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Youtube = (url) => new Promise((resolve, reject) => {
	const shortDomainID = url.href.match(/youtu\.be\/([^"&?\/\s]+)$/i)?.[1];
	const fullDomainID = /youtube\.com/gi.test(url.hostname) && ParseQuery(url.search)?.["v"];

	if (!shortDomainID && !fullDomainID)
		return reject("Bad youtube link");

	const youtubeLink = `https://www.youtube.com/watch?v=${shortDomainID || fullDomainID}`;

	return YoutubeDLExec(youtubeLink, {
		dumpSingleJson: true,
		noWarnings: true,
		noCallHome: true,
		noCheckCertificate: true,
		preferFreeFormats: true,
		youtubeSkipDashManifest: true,
		referer: "https://youtube.com"
	})
	.then(resolve)
	.catch(reject);
})
.then(/** @param {import("../types/youtube-dl").YoutubeDLOutput} youtubeVideoOutput */ (youtubeVideoOutput) => {
	/** @type {import("../types").SocialPost} */
	const socialPost = {
		author: youtubeVideoOutput.uploader,
		authorURL: youtubeVideoOutput.uploader_url,
		caption: youtubeVideoOutput.title + (youtubeVideoOutput.description?.length < 50 ? youtubeVideoOutput.description : ""),
		postURL: youtubeVideoOutput.webpage_url,
		medias: []
	}

	/**
	 * @param {number} bytes
	 * @returns {string}
	 */
	const LocalHumanReadableSize = (bytes) => {
		const power = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, power)).toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][power]}`;
	}

	if (!youtubeVideoOutput.formats) return Promise.resolve(socialPost);

	const sortedFormats = youtubeVideoOutput.formats.sort((prev, next) => prev.height - next.height);

	sortedFormats.forEach((format) => {
		if (
			(!format.vcodec || format.vcodec === "none") &&
			(typeof format.acodec == "string" && format.acodec !== "none")
		)
			socialPost.medias.push({
				type: "audio",
				externalUrl: format.url,
				filesize: format.filesize,
				filetype: format.ext,
				description: `${format.format_note} / ${format.acodec.split(".")[0]} (${format.ext}) – audio${format.filesize ? " / " + LocalHumanReadableSize(format.filesize) : ""}`
			});
		else if (
			(!format.acodec || format.acodec === "none") &&
			(typeof format.vcodec == "string" && format.vcodec !== "none")
		)
			socialPost.medias.push({
				type: "video",
				externalUrl: format.url,
				filesize: format.filesize,
				filetype: format.ext,
				description: `${format.format_note} / ${format.vcodec.split(".")[0]} (${format.ext}) – video${format.filesize ? " / " + LocalHumanReadableSize(format.filesize) : ""}`
			});
		else if (
			(typeof format.acodec == "string" && format.acodec !== "none") &&
			(typeof format.vcodec == "string" && format.vcodec !== "none")
		)
			socialPost.medias.push({
				type: "video",
				externalUrl: format.url,
				filesize: format.filesize,
				filetype: format.ext,
				description: `${format.format_note} / ${format.vcodec.split(".")[0]} + ${format.acodec.split(".")[0]} (${format.ext}) – video + audio${format.filesize ? " / " + LocalHumanReadableSize(format.filesize) : ""}`
			});
	});

	return Promise.resolve(socialPost);
})
.catch((e) => Promise.reject(new Error(`youtube-dl-exec error: ${e}`)));

/**
 * @param {URL} url
 * @returns {Promise<import("../types").SocialPost>}
 */
const Osnova = (url) => {
	const siteHostname = url.hostname.replace(/^.*\.(\w+\.\w+)$/, "$1").replace("the.tj", "tjournal.ru");

	const isUser = /^\/u/i.test(url.pathname);
	const postID = (isUser ? 
		url.pathname.match(/^\/u\/\d+[\w\-]+\/(?<postID>\d+)/)
		:
		url.pathname.match(/^(?:(?:\/s)?\/[\w\-]+)?\/(?<postID>\d+)/)
	)?.groups?.["postID"];

	if (!postID) return Promise.resolve(null);
	
	return NodeFetch(`https://api.${siteHostname}/v1.9/entry/${postID}`)
	.then((res) => {
		if (res.status === 200)
			return res.json()
			.then((response) => {
				/** Osnova API post wrapped in `result` */
				if (response.result)
					return Promise.resolve(response.result);
				else
					return Promise.reject(new Error("No <result> in Osnova API response"));
			});
		else
			return Promise.reject(new Error(`Status code = ${res.status} ${res.statusText}. URL = ${url.href}`));
	})
	.then(/** @param {import("../types/osnova").OsnovaPost} osnovaPost */ (osnovaPost) => {
		/** @type {import("../types").SocialPost} */
		const socialPost = {
			author: osnovaPost.author.name,
			authorURL: osnovaPost.author.url,
			caption: osnovaPost.title || "",
			postURL: osnovaPost.url,
			medias: []
		};


		/** @type {{ waiting: "Twitter" | "Instagram", link: string }[]} */
		const waitingExternalQueue = [];


		/**
		 * @param {{ waiting: "Twitter" | "Instagram", link: string }} param0
		 * @returns {Promise<import("../types").Media[]>}
		 */
		const LocalLoadExternalBlock = ({ waiting, link }) => {
			if (waiting !== "Twitter" && waiting !== "Instagram")
				return Promise.resolve([]);

			return (waiting === "Twitter" ? Twitter : Instagram)(SafeParseURL(link))
			.then((externalBlockPost) => {
				/** Block in Osnova post is corrupted */
				if (!(externalBlockPost?.medias instanceof Array))
					return Promise.resolve([]);

				return Promise.resolve(externalBlockPost.medias);
			})
			.catch((e) => {
				LogMessageOrError(new Error(`Failed to load block data (${link}) inside Osnova post: ${e}`));
				return Promise.resolve([]);
			});
		}
		

		osnovaPost.blocks.forEach((block) => {
			if (block.type === "tweet")
				return waitingExternalQueue.push({
					waiting: "Twitter",
					link: `https://twitter.com/${
						block.data.tweet.data.tweet_data.user.screen_name
					}/status/${block.data.tweet.data.tweet_data.id_str}`
				});

			if (block.type === "instagram")
				return waitingExternalQueue.push({
					waiting: "Instagram",
					link: block.data.instagram.data.box_data.url
				});

			if (block.type == "media" && block.data.items)
				block.data.items.forEach((media) => {
					if (!media.image) return;

					const isImage = (
						media.image.data.type == "jpg" ||
						media.image.data.type == "jpeg" ||
						media.image.data.type == "png"
					);

					socialPost.medias.push({
						type: (isImage ? "photo" : "video"),
						externalUrl: `https://leonardo.osnova.io/${media.image.data.uuid}/${isImage ? "-/preview/1000/" : "-/format/mp4/"}`,
						original: `https://leonardo.osnova.io/${media.image.data.uuid}`
					});
				});
		});


		if (!waitingExternalQueue.length)
			return Promise.resolve(socialPost);

		return Promise.all(
			waitingExternalQueue.map((waitingExternalQueueBlock) =>
				LocalLoadExternalBlock(waitingExternalQueueBlock)
			)
		)
		.then((mediasFromExternalBlocks) => {
			socialPost.medias = socialPost.medias.concat(mediasFromExternalBlocks.flat());
			return Promise.resolve(socialPost);
		});
	});
};



module.exports = {
	Twitter,
	TwitterImg,
	Instagram,
	Pixiv,
	Reddit,
	Tumblr,
	Danbooru,
	Gelbooru,
	Konachan,
	Yandere,
	Eshuushuu,
	Sankaku,
	Zerochan,
	AnimePictures,
	KemonoParty,
	Youtube,
	Osnova
};
