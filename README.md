# Social-Picker-API

This project is used to extract media from various posting platforms like Twitter, Reddit, Pixiv, Youtube and many others. It's written for Node.js and it works as local service for other local services, e.g. [Anime Ultra Bot](https://github.com/serguun42/Anime-Ultra-Bot) or [Social Picker Vue](https://github.com/serguun42/Social-Picker-Vue).

Usage: give a link to the post and receive its content.

### Configs

There are some configuration files:

- [`service.json`](./config/service.json) – service port and external service for viewing some content with additional local proxy
- [`tokens.json`](./config/tokens.json) – tokens for some platforms
- [`pm2.production.json`](./config/pm2.production.json) – config for `pm2` daemon
- [`nodemon.dev.json`](./config/nodemon.dev.json) – config development hot-reloader `nodemon`

Development config files can be created and placed along production ones (e.g. `tokens.dev.json`). You can also install all npm modules (including dev) one with `npm install`. `npm run dev` will run service in dev-environment, `npm run lint` will use `eslint`.

### How to run

1. Install necessary dependencies – `npm i --production`
2. Run production server – `npm run production`

After launching you can access Picker with fetching it like `curl http://localhost:8080/?url=__LINK_TO_ANY_POST__` (change `8080` to real port you specified in [`service.json`](./config/service.json)). If you're planning opening your Picker instance to the world, I'd suggest creating your own middleware service for handling user access, downloading combined videos ([something like that](https://social.serguun42.ru/docs/redoc.html))

### List of platforms

- _Twitter_ – images, videos and gifs
- _Twitter's direct media_ – from `*.twimg.com`
- _Nitter_ – Twitter clone
- _Instagram_ – images, videos and galleries
- _Pixiv_ – images and _Ugoira_-gifs. Uses external service for end-user viewing of high-res images due to Referer Header issues. Uses [`ugoira-builder`](./util/ugoira-builder.js) for creating mp4 video from Ugoira zip (via `ffmpeg`)
- _Pixiv's direct images_ – from `*.pximg.net`
- _Reddit_ – images, videos, gifs and galleries. Uses [`video-audio-merge`](./util/video-audio-merge.js) for merging separate streams (via `ffmpeg`)
- _Youtube_ – video with response in [default type](./types/social-post.d.ts) containing all streams (via `yt-dlp`)
- _Osnova_ – images, videos, gifs and galleries. Also extracts Twitter and Instagram blocks/links from within and handles them with parsers above
- _Tumblr_ – images and galleries
- _Danbooru_ – images
- _Gelbooru_ – images
- _Konachan_ – images
- _Yandere_ – images
- _Eshuushuu_ – images
- _Sankaku_ – images
- _Zerochan_ – images
- _AnimePictures_ – images
- _KemonoParty_ – images
- _Joyreactor_ – images and gifs from `[joy/safe/anime./etc…]reactor.сс` including `m.` subdomains and direct links to media files
- _Coub_ – looped videos with linear audio. Uses [`video-audio-merge`](./util/video-audio-merge.js) for merging separate streams (via `ffmpeg`)

#### Some links

- [Telegram bot based on this service](https://github.com/serguun42/Anime-Ultra-Bot)
- [Telegram Bots API](https://core.telegram.org/bots/api)
- [Twitter API page for getting tweets](https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets-id)
- [Tumblr API](https://www.tumblr.com/docs/en/api/v2)
- [ffmpeg](https://ffmpeg.org/ffmpeg.html)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Osnova API](https://cmtt-ru.github.io/osnova-api/)
