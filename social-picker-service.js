const http = require("http");

/**
 * @param {{[code: string]: string}} iStatusCodes
 * @returns {{[code: number]: string}}
 */
const GetStatusCodes = (iStatusCodes) => {
	const newCodes = {};

	Object.keys(iStatusCodes).forEach((code) => newCodes[code] = `${code} ${iStatusCodes[code]}`)

	return newCodes;
};

/**
 * HTTP Response Statuses
 * @type {{[code: number]: string}}
 */
const STATUSES = GetStatusCodes(http.STATUS_CODES);

const DEV = require("./util/is-dev");
const { PORT } = (DEV ? require("./config/service.dev.json") : require("./config/service.json"));
const LogMessageOrError = require("./util/log");
const { SafeParseURL, SetCompleteMIMEType, ParseQuery } = require("./util/urls");
const {
	AnimePictures,
	Danbooru,
	Eshuushuu,
	Gelbooru,
	Instagram,
	Konachan,
	Pixiv,
	Reddit,
	Sankaku,
	Tumblr,
	Twitter,
	TwitterImg,
	Yandere,
	Zerochan,
	KemonoParty,
	Youtube,
	Osnova
} = require("./core/social-parsers");



/**
 * @param {string} givenURL
 * @returns {{ status: boolean, url: URL, platform: (url: URL) => Promise<import("./types").SocialPost> }}
 */
const CheckForLink = (givenURL) => {
	const url = SafeParseURL(givenURL);

	if (
		url.hostname === "twitter.com" ||
		url.hostname === "www.twitter.com" ||
		url.hostname === "mobile.twitter.com" ||
		url.hostname === "nitter.net" ||
		url.hostname === "www.nitter.net" ||
		url.hostname === "mobile.nitter.net"
	)
		return { status: true, platform: Twitter, url };
	else if (
		url.hostname === "pbs.twimg.com"
	)
		return { status: true, platform: TwitterImg, url };
	else if (
		url.hostname === "instagram.com" ||
		url.hostname === "www.instagram.com"
	)
		return { status: true, platform: Instagram, url };
	else if (
		url.hostname === "reddit.com" ||
		url.hostname === "www.reddit.com"
	)
		return { status: true, platform: Reddit, url };
	else if (
		url.hostname === "pixiv.net" ||
		url.hostname === "www.pixiv.net"
	)
		return { status: true, platform: Pixiv, url };
	else if (
		/tumblr\.(com|co\.\w+|org)$/i.test(url.hostname || "")
	)
		return { status: true, platform: Tumblr, url };
	else if (
		url.hostname === "danbooru.donmai.us" ||
		url.origin === "https://danbooru.donmai.us"
	)
		return { status: true, platform: Danbooru, url };
	else if (
		url.hostname === "gelbooru.com" ||
		url.hostname === "www.gelbooru.com"
	)
		return { status: true, platform: Gelbooru, url };
	else if (
		url.hostname === "konachan.com" ||
		url.hostname === "konachan.net" ||
		url.hostname === "www.konachan.com" ||
		url.hostname === "www.konachan.net"
	)
		return { status: true, platform: Konachan, url };
	else if (
		url.hostname === "yande.re" ||
		url.hostname === "www.yande.re"
	)
		return { status: true, platform: Yandere, url };
	else if (
		url.hostname === "e-shuushuu.net" ||
		url.hostname === "www.e-shuushuu.net"
	)
		return { status: true, platform: Eshuushuu, url };
	else if (
		url.hostname === "chan.sankakucomplex.com" ||
		url.origin === "https://chan.sankakucomplex.com"
	)
		return { status: true, platform: Sankaku, url };
	else if (
		url.hostname === "zerochan.net" ||
		url.hostname === "www.zerochan.net"
	)
		return { status: true, platform: Zerochan, url };
	else if (
		url.hostname === "anime-pictures.net" ||
		url.hostname === "www.anime-pictures.net"
	)
		return { status: true, platform: AnimePictures, url };
	else if (
		url.hostname === "kemono.party" ||
		url.hostname === "www.kemono.party"
	)
		return { status: true, platform: KemonoParty, url };
	else if (
		url.hostname === "youtube.com" ||
		url.hostname === "www.youtube.com" ||
		url.hostname === "youtu.be" ||
		url.hostname === "m.youtube.com"
	)
		return { status: true, platform: Youtube, url };
	else if (
		url.hostname === "tjournal.ru" ||
		url.hostname === "the.tj" ||
		url.hostname === "dtf.ru" ||
		url.hostname === "vc.ru"
	)
		return { status: true, platform: Osnova, url };
	else
		return { status: false };
};


/**
 * @type {{ [combinedFilename: string]: () => string }}
 */
const VideoHooksStorage = {};


http.createServer((req, res) => {
	const queries = ParseQuery(SafeParseURL(req.url).search);

	res.setHeader("Content-Type", "charset=UTF-8");

	/**
	 * @param {number} iCode
	 * @param {string | Buffer | ReadStream | Object} iData
	 * @returns {false}
	 */
	const SendObject = (iCode, iData) => {
		res.statusCode = iCode;

		if (iData instanceof Buffer || typeof iData == "string") {
			const dataToSend = iData.toString();

			res.end(dataToSend);
		} else {
			const dataToSend = JSON.stringify(iData);
			res.setHeader("Content-Type", SetCompleteMIMEType(".json"));

			res.end(dataToSend);
		}

		return false;
	};

	/**
	 * @param {number} iCode
	 * @returns {false}
	 */
	const SendStatus = iCode => {
		res.statusCode = iCode || 200;
		res.end(STATUSES[iCode || 200]);
		return false;
	};


	/** Hook for deleting combined videos when they are sent */
	if (queries["video-done"]) {
		if (typeof VideoHooksStorage[queries["video-done"]] == "function")
			VideoHooksStorage[queries["video-done"]]();

		return SendStatus(200);
	} else if (typeof queries["url"] == "string") {
		const checkedForLink = CheckForLink(queries["url"]);

		if (!checkedForLink.status || !checkedForLink.url || typeof checkedForLink.platform !== "function")
			return SendStatus(404);


		return checkedForLink.platform(checkedForLink.url)
		.then((socialPost) => {
			if (!socialPost?.medias) return SendStatus(404);

			socialPost.medias.forEach((media) => {
				if (!media.fileCallback) return;

				/** Storing hook for deleting combined videos */
				VideoHooksStorage[media.filename] = media.fileCallback;

				/** Deleting video in 5 minutes in any case */
				setTimeout(() => {
					media.fileCallback();
					delete VideoHooksStorage[media.filename];
				}, 1000 * 60 * 5);
			});

			return SendObject(200, socialPost);
		})
		.catch((e) => {
			LogMessageOrError(e);
			SendStatus(500);
		});
	} else
		return SendStatus(404);
}).listen(PORT);
