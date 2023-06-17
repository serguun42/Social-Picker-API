# Social-Picker-API

This project is used to extract media from various posting platforms like Twitter, Reddit, Pixiv, Youtube, Tiktok, Osnova and many others. It's written for Node.js and it works as local service for other local services, e.g. [Anime Ultra Bot](https://github.com/serguun42/Anime-Ultra-Bot) or [Social Picker Vue](https://github.com/serguun42/Social-Picker-Vue).

## Usage

Start a server, make HTTP-request to it with a link to the post and receive that post's content back.

## Configs

There are some configuration files:

- [`service.json`](./config/service.json) – service port and external service for viewing some content with additional local proxy
- [`tokens.json`](./config/tokens.json) – tokens for platforms and other filepaths. See [Platform specific](#Platform-specific) and [`types/configs.d.ts`](./types/configs.d.ts)
- [`pm2.production.json`](./config/pm2.production.json) – config for `pm2` daemon
- Other configuration files for particular platforms – see [Platform specific](#Platform-specific)

Development config files can be created and placed along production ones (e.g. `tokens.dev.json` or `service.dev.json`). You can also install all npm modules (including dev) one with `npm install`. `npm run dev` will run service in dev-environment, `npm run lint` will use `eslint`.

## How to run

1. Install necessary dependencies – `npm i --production`
2. [Install necessary binaries needed for some platforms](#binaries)
3. Start server – `npm run production`

After launching you can access Picker with fetching it like `curl http://localhost:8080/?url=__LINK_TO_ANY_POST__` (change `8080` to real port you specified in [`service.json`](./config/service.json)). If you're planning opening your Picker instance to the world, I'd suggest creating your own middleware service for handling user access, downloading combined videos, etc. ([something like that](https://social.serguun42.ru/docs/redoc.html)).

## List of supported platforms

- _Twitter_ – images, videos, GIFs and direct media from `*.twimg.com`. [**More details**](#twitter)
- _Pixiv_ – images, single direct media from `*.pximg.net` and _Ugoira_-GIFs. [**More details**](#pixiv)
- _Reddit_ – images, videos, GIFs and galleries. [**More details**](#reddit)
- _Youtube_ – video with response in [default type](./types/social-post.d.ts) containing all streams (via `yt-dlp`)
- _Tiktok_ – Any video in multiple formats. [**More details**](#tiktok)
- _Instagram_ – images, videos, galleries and Reels. [**More details**](#instagram)
- _Osnova_ – images, videos, GIFs and galleries. [**More details**](#osnova)
- _Coub_ – looped videos with linear audio. [**More details**](#coub)
- _Joyreactor_ – images and GIFs from multiple subdomains and direct links to media files
- _Tumblr_ – images and galleries. [**More details**](#tumblr)
- _KemonoParty_ – images
- _Danbooru_ – images (unstable)
- _Gelbooru_ – images (unstable)
- _Konachan_ – images (unstable)
- _Yandere_ – images (unstable)
- _Eshuushuu_ – images (unstable)
- _Sankaku_ – images (unstable)
- _Zerochan_ – images (unstable)
- _AnimePictures_ – images (unstable)

### Platform specific

#### Binaries

Some platform modules utilizes binary executable, here is the list:

- `Social Picker Twitter Scrapper` – read more about [Twitter specific](#twitter)
- `ffmpeg` – for media stream merging and convering. Follow instructions on [the official site](https://ffmpeg.org/download.html). After installing make sure you added its location to [`$PATH`](<https://en.wikipedia.org/wiki/PATH_(variable)>)
- `yt-dlp` – for picking some video-platforms. Download [built release](https://github.com/yt-dlp/yt-dlp/releases) for your platform, make it executable and ensure its location is in the [`$PATH`](<https://en.wikipedia.org/wiki/PATH_(variable)>)

#### Twitter

Supports images, videos, GIFs (temporary unstable) and direct media from `*.twimg.com`.

This project uses [Social Picker Twitter Scrapper](https://github.com/serguun42/Social-Picker-Twitter-Scrapper) – wrapper [for `twitter-scraper` lib](https://github.com/n0madic/twitter-scraper) in Go to fetch tweets without API. Thus if you want to get Tweets, you should consider (before running this app) reading that project README and then placing compiled executable and created its config-files into such folders:

1. Move executable file `Social-Picker-Twitter-Scrapper` in [`bin`](./bin/) folder
2. Move generated `cookies.json` in [`config`](./config/), choose a explicit name for it, e.g. `twitter-scrapper-cookies.json`
   - For convenience you can move `credentials.json` next to `cookies.json` (this app and executable binary use only cookies file).
3. Check and edit [tokens.json](./config/tokens.json) – give a look to properties `TWITTER_SCAPPER.binary_file_path` and `TWITTER_SCAPPER.cookies_file_path`: paths are relative to project's root, default ones are in accordance to this example.

#### Pixiv

Supports images, single direct media from `*.pximg.net` and _Ugoira_-GIFs.

Uses external service for end-user viewing of high-res images due to Referer Header issues. Uses [`ugoira-builder`](./util/ugoira-builder.js) for creating mp4 video from Ugoira ZIP with PNGs (via `ffmpeg`).

#### Reddit

Supports images, videos, GIFs and galleries. Because Reddit's videos are divided from audios, this app utilizes [`video-audio-merge`](./util/video-audio-merge.js) for merging separated streams (via `ffmpeg`).

#### Tiktok

Any video in multiple formats. Does not support image galleries.

Uses `yt-dlp` for extracting metadata and then [`video-codec-convert`](./util/video-codec-convert.js) to convert original highest quality HEVC video without watermark to H264 file (via `ffmpeg`) for compatibility. Still prioritizes HEVC one.

#### Instagram

Supports images, videos, galleries and Reels.

_To pick default regular post_ (square photos, videos and galleries) set property `INSTAGRAM_COOKIE_ONE_LINE_FOR_POSTS` in [tokens.json](./config/tokens.json). Place there contents of cookies from your web-browser's DevTools (Press `F12` —> `Console` tab —> type `document.cookie` —> press `Enter`).

> _Question_: Are those cookies enough?<br> _Answer_: Works well for me! If they're not sufficient anymore, copy from DevTools tabs `Network` or `Application`

_To pick Reels_:

1. Install [this browser extension](https://github.com/kairi003/Get-cookies.txt-LOCALLY) – it's open source and it supports Chrome and Firefox
2. Go to [instagram.com](https://instagram.com)
3. Copy cookies (click `Copy` button in extension popup)
4. Create file `config/instagram.cookies.txt` and paste there contents from clipboard (it starts with `"# Netscape HTTP Cookie File"`)
5. Check and edit [tokens.json](./config/tokens.json) – give a look to property `INSTAGRAM_COOKIE_FILE_LOCATION_FOR_REELS`: set path relative to project's root, default one is in accordance to this example.

#### Osnova

Supports images, videos, GIFs and galleries. Also extracts Twitter and Instagram blocks/links from within and handles them with parsers above.

#### Coub

Creates looped videos with linear audio, limits itself only with audio length and filesize if it ever exceed a reasonable size (20 MB). Uses [`video-audio-merge`](./util/video-audio-merge.js) for merging separated streams (via `ffmpeg`).

#### Tumblr

Supports images and galleries, set OAuth keys and stuff in [tokens.json](./config/tokens.json).

---

### Read more

- [Social Picker Twitter Scrapper](https://github.com/serguun42/Social-Picker-Twitter-Scrapper) – wrapper [for `twitter-scraper` lib](https://github.com/n0madic/twitter-scraper) in Go
- [Telegram bot based on this service](https://github.com/serguun42/Anime-Ultra-Bot)
- [Frontend client built for this service](https://github.com/serguun42/Social-Picker-Vue)
- [ffmpeg docs](https://ffmpeg.org/ffmpeg.html)
- [yt-dlp docs](https://github.com/yt-dlp/yt-dlp#readme)
- [Tumblr API](https://www.tumblr.com/docs/en/api/v2)
- [Osnova API](https://cmtt-ru.github.io/osnova-api/)
- [`twitter-scraper` Go lib](https://github.com/n0madic/twitter-scraper)
- [What is Pixiv's Ugoira](https://www.pixiv.help/hc/en-us/articles/235584628-What-are-Ugoira-)

---

### [BSL-1.0 License](./LICENSE)
