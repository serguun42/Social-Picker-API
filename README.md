# Social-Picker-API

This project is used to extract media from various posting platfroms like Twitter, Reddit, Pixiv, Youtube and many others. It's written for Node.js

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
