---
name: chesser-deploy
description: How to deploy Chesser to the web for free on Render (static app + Node online server, both from this repo) and the everyday `git push` pipeline. Use when deploying, changing hosting, or wiring the app to its online server.
---

# Deploying Chesser (Render, free)

Everything is driven by `render.yaml` (a Render **Blueprint**) — one repo, two services,
deployed by a plain `git push`. Full step-by-step is in `DEPLOY.md`; this is the summary.

## The two services (`render.yaml`)
- **chesser-app** — `runtime: static`, `buildCommand: node build.js`, publishes `dist/`.
  Always-on CDN (never sleeps). This URL is the app.
- **chesser-server** — `runtime: docker` from `Dockerfile`, runs `online-server.js`.
  Free tier **sleeps when idle**, wakes on the next connection. Health check `/api/health`.
- The blueprint auto-wires the app to the server: it injects `CHESSER_SERVER` (the server's
  host) as a build env var, and `build.js` bakes it into `dist/config.js`. **No manual URL
  editing.**

## Client wiring — `config.js` + `serverHost()`
- `config.js` sets `window.CHESSER_SERVER` (host only, e.g. `chesser-server.onrender.com`;
  empty = same origin, which is how local `npm run online` works).
- `serverHost()` in `app.js` prefers `window.CHESSER_SERVER` (strips any `https://` / trailing
  slash); `onlineWsUrl()`/`serverApi()` build `wss://`/`https://` from it on an https page.
- `build.js` substitutes `CHESSER_SERVER` from the environment into the built `config.js` when
  present (that's the Render auto-wire); locally it stays empty.

## One-time setup
1. `git push -u origin main` (repo is `MoreDesignLessCode/chess-app`, **public**).
2. render.com → sign in with GitHub (free, no card).
3. **New +** → **Blueprint** → pick the repo → Apply. Render builds both services.
4. The **chesser-app** service URL is the live link.

## Everyday pipeline
```bash
git push          # or: npm run deploy  (aliased to git push)
```
Render redeploys both services automatically on every push.

## Notes
- `Dockerfile` installs only `ws`, copies `online-server.js`, sets `CHESSUP_NO_BROWSER=1`
  (don't try to open a browser server-side), and lets the host provide `PORT`.
- **Netlify alternative** for the app only: `npm run deploy:netlify` (`netlify.toml` +
  `build.js`); then set the server host in `config.js` by hand (Netlify doesn't auto-wire it).
- `fly.toml` is not used (the project moved from Fly to Render).
- Keep the `name:` under `chesser-server` and the `fromService.name` in `chesser-app` matching
  in `render.yaml`, or the auto-wire breaks.
