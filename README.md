# Social-Picker-API

This project is used to extract media from various posting platforms like Twitter, Reddit, Pixiv, Youtube and many others. It's written for Node.js and it works as local service for other local services, e.g. [Anime Ultra Bot](https://github.com/serguun42/Anime-Ultra-Bot) or [Social Picker Vue.js](https://github.com/serguun42/Social-Picker-Vue).

Send link to post – receive its content.

### Configs

There are some configuration files:

-   [`service.json`](./config/service.json) – service port and external service for viewing some content
-   [`tokens.json`](./config/tokens.json) – tokens for some platforms
-   [`pm2.production.json`](./config/pm2.production.json) – config for Node.js daemon `pm2`
-   [`nodemon.dev.json`](./config/nodemon.dev.json) – config development hot-reloader `nodemon`

Development config files can be created and placed along production ones (e.g. `tokens.dev.json`). You can also install all npm modules (including dev) one with `npm install`. `npm run dev` will run service in dev-environment.

### Commands / How to use

1. Install necessary dependencies – `npm i --production`
2. Run production server – `npm run production`

After launching you can access Picker with fetching it like `curl http://localhost:8080/?url=__LINK_TO_ANY_POST__` (change `8080` to real port you specified in [`service.json`](./config/service.json)). If you're planning opening your Picker instance to the world, I'd suggest creating your own middleware service for handling user access, downloading combined videos ([something like that](https://social.serguun42.ru/docs/redoc.html))

### List of platforms

-   _Twitter_ – images, videos and gifs
-   _Twitter's direct images_ – like twimg.com
-   _Nitter_ – Twitter clone
-   _Instagram_ – images, videos including posts with multiple ones
-   _Pixiv_ – images. Uses external service for end-user viewing of hi-res images due to Referer Header issues.
-   _Reddit_ – images, videos and gifs including posts with multiple ones. Uses [`combine-video`](./util/combine-video.js) for joining audio- and video-streams via `ffmpeg`
-   _Youtube_ – videos with only video streams, only audio streams and both
-   _Osnova_ – images extracted from post
-   _Tumblr_ – images and galeries
-   _Danbooru_ – images
-   _Gelbooru_ – images
-   _Konachan_ – images
-   _Yandere_ – images
-   _Eshuushuu_ – images
-   _Sankaku_ – images
-   _Zerochan_ – images
-   _AnimePictures_ – images
-   _KemonoParty_ – images

#### Some links

-   [Telegram bot based on this service](https://github.com/serguun42/Anime-Ultra-Bot)
-   [Telegram Bots API](https://core.telegram.org/bots/api)
-   [Twitter API page for getting tweets](https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets-id)
-   [Tumblr API](https://www.tumblr.com/docs/en/api/v2)
-   [ffmpeg](https://ffmpeg.org/ffmpeg.html)
-   [Youtube-DL](https://github.com/ytdl-org/youtube-dl)
-   [Osnova API](https://cmtt-ru.github.io/osnova-api/)
