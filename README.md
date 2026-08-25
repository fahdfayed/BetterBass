# Outside In — Bass Lab

A clean, standalone Node.js edition of Outside In. It contains only the code and content needed to run the complete Bass Lab on your own computer or Node server.

## What this repo uses

- Node.js + Express for the server and API
- React + Vite for the browser interface
- A local JSON data store for anonymous learner progress
- Browser-native Web Audio, microphone analysis and speech synthesis

There is no Next.js, Cloudflare, Vinext, ChatGPT authentication or hosted-platform configuration in this repository.

## Run locally

Install Node.js 22.13 or newer, then run:

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

Use `localhost` in the browser. `0.0.0.0` is the server's listening address, not the page address you should open.

The development command runs one Express server. Vite is attached as development middleware, so the client refreshes when you edit source files.

## Production mode

```bash
npm ci
npm run build
npm start
```

The production server serves the built React client and the API from the same port. The default address is `http://localhost:3000`.

## Deploy to Vercel

This repository includes the root `server.mjs` entrypoint Vercel expects. Vercel runs the Express API as a Node function, serves the Vite assets from `public/`, and lets Express return the SPA for `/` and client-side routes. The checked-in `vercel.json` runs the standard `npm run build` command and includes the generated client with the function, so deployment does not depend on dashboard command overrides.

1. Import the repository into Vercel.
2. Keep **Root Directory** at the repository root. If the repository contains an outer `outside-in-bass-node` folder, select that folder as the Root Directory instead.
3. Use the **Node** framework preset.
4. Leave **Build Command**, **Output Directory**, **Install Command**, and **Development Command** overrides switched off. The repository configuration owns the build command.
5. Deploy or redeploy without the previous build cache.

Do not set the entrypoint to `server/index.mjs`: that file starts a normal long-running local server. Vercel uses the root `server.mjs`, which exports the Express app instead.

Vercel functions do not provide durable local-disk storage. Course progress still remains in the browser's local storage; the `/tmp` API copy is temporary on Vercel. Use the normal `npm start` deployment on a VPS, Render, Railway or another persistent Node host when cross-device server persistence is required.

## Verify everything

```bash
npm run check
```

This checks the TypeScript source, builds the client and tests the Node API, learner-state persistence, take analysis and SPA routing.

## Voice coach

The header contains a global **Voice on/off** switch and a **Test** button. Spoken coaching uses the browser voices installed on the computer. Chrome or Edge on Windows is recommended; click Test once after opening the site so the browser can load and unlock its voice engine.

## Useful environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port used by the Node server |
| `HOST` | `0.0.0.0` | Network interface used by Express |
| `BASSLAB_DATA_FILE` | `.data/learners.json` | Learner progress and session file |
| `BASSLAB_CLIENT_DIR` | `dist/client` | Built React client directory |
| `TRUST_PROXY` | unset | Set to `1` behind one trusted reverse proxy |

## Project structure

```text
src/       React interface, curriculum, theory data, audio engines and styles
server/    Express server, API and file-backed learner store
public/    Static course material
tests/     Node API and persistence tests
```

## Data and privacy

The browser creates an anonymous learner ID. Course progress and derived practice measurements are synchronized to `.data/learners.json`. Raw microphone audio never leaves the browser and is not saved by the server.

For microphone access on another device, serve the site over HTTPS. Browsers allow microphone access on `localhost`, but usually block it on an unsecured remote address.
