# Social-Picker-API

This project is used to extract media from various posting platfroms like Twitter, Reddit, Pixiv, Youtube and many others. It's written for Node.js and it works as inner service for other local services, e.g. like [Anime Ultra Bot](https://github.com/serguun42/Anime-Ultra-Bot).

Send link to post – receive its content.

### Commands
1. Install necessary dependencies – `npm i --production`
2. Run production server – `npm run production`

### Configs

There are some configuration files:
* [`service.json`](./config/service.json) – service port and external service for viewing some content
* [`tokens.json`](./config/tokens.json) – tokens for some platforms
* [`pm2.production.json`](./config/pm2.production.json) – config for Node.js daemon `pm2`
* [`nodemon.dev.json`](./config/nodemon.dev.json) – config development hot-reloader `nodemon`

Development config files can be created and placed along production ones (e.g. `tokens.dev.json`). You can also install all npm modules (including dev) one with `npm install`. `npm run dev` will run service in dev-environment.

#### List of platforms

* *Twitter* – images, videos and gifs
* *Twitter's direct images* – like twimg.com
* *Nitter* – Twitter clone
* *Instagram* – images, videos including posts with multiple ones
* *Pixiv* – images. Uses external service for end-user viewing of hi-res images due to Referer Header issues.
* *Reddit* – images, videos and gifs including posts with multiple ones. Uses [`combine-video`](./util/combine-video.js) for joining audio- and video-streams via `ffmpeg`
* *Youtube* – videos with only video streams, only audio streams and both
* *Osnova* – images extracted from post
* *Tumblr* – images and galeries
* *Danbooru* – images
* *Gelbooru* – images
* *Konachan* – images
* *Yandere* – images
* *Eshuushuu* – images
* *Sankaku* – images
* *Zerochan* – images
* *AnimePictures* – images
* *KemonoParty* – images


#### Some links
* [Telegram Bots API](https://core.telegram.org/bots/api)
* [Twitter API page for getting status](https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-show-id)
* [Tumblr API](https://www.tumblr.com/docs/en/api/v2)
* [ffmpeg](https://ffmpeg.org/ffmpeg.html)
* [Youtube-DL](https://github.com/ytdl-org/youtube-dl)
* [Osnova API](https://cmtt-ru.github.io/osnova-api/)
