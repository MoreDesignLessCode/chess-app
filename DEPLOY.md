# Deploying Chesser to the web

This puts Chesser online at a real URL, for free, using **[Render](https://render.com)** and
your GitHub repo. After a one-time setup, your pipeline is a single command — **`git push`** —
and Render rebuilds and redeploys automatically.

Everything is driven by [`render.yaml`](render.yaml), which deploys **two** things from this
one repo:

| Service (Render name) | What it is | Sleeps? | Needed for |
| --- | --- | --- | --- |
| **chesser-app** | the website (static files) | never — always fast | everything; this is your URL |
| **chesser-server** | the little Node server (`online-server.js`) | sleeps when idle (free) | live games vs strangers + World chat |

The website works fully on its own — play vs the computer, puzzles, lessons, achievements,
packs, membership all run in the browser. The server is **only** for live games against
strangers and the World chat room; without it those two show a friendly "use Lichess"
message and nothing else is affected.

The blueprint auto-wires the app to the server (via `CHESSER_SERVER` in `render.yaml`), so
you never have to paste URLs around.

---

## One-time setup

1. **Push this code to your GitHub repo** (Render deploys from GitHub):
   ```bash
   git push -u origin main
   ```
   > ⚠️ Your repo `MoreDesignLessCode/chess-app` is **public**, so the source becomes
   > publicly visible once pushed. If you'd rather keep it private, flip it to Private on
   > GitHub first (repo → Settings → General → Danger Zone → Change visibility).

2. **Create a free Render account** at [render.com](https://render.com) — you can sign in
   with GitHub, which also lets Render see your repo. No credit card required for free
   services.

3. **Create the Blueprint.** In the Render dashboard click **New +** → **Blueprint**, pick
   the `chess-app` repo, and confirm. Render reads `render.yaml` and creates **both**
   services. First build takes a few minutes.

4. When it finishes, open the **chesser-app** service — its URL (something like
   `https://chesser-app.onrender.com`) is your link. 🎉

That's it. The app is already pointed at the server automatically.

---

## Everyday updates (your whole pipeline)

Change any code, then:

```bash
git push        # or: npm run deploy  (same thing)
```

Render notices the push and redeploys both services on its own. That's the entire pipeline.

---

## Test locally before you push (optional)

- Run the full thing (app + online server together) on your computer:
  ```bash
  npm run online
  ```
  Then open the printed `http://localhost:4180` — open it in two windows to try a live game.

- Or just check the built website:
  ```bash
  npm run build && npx serve dist
  ```

---

## Notes

- **The free server sleeps when idle** and takes a few seconds to wake on the first
  connection — normal, and it costs nothing while asleep. The website itself never sleeps,
  so the site always loads fast; only the very first "play a stranger" click after a quiet
  spell has a short wait.
- **Prefer Netlify for the website instead?** The pieces still work separately. Run
  `npm run deploy:netlify` (needs `npm i -g netlify-cli` and `netlify login` once). If you
  do that, set the server host in [`config.js`](config.js) by hand, since only Render's
  blueprint fills it in for you.
- Renaming the services in `render.yaml`? Keep the `name:` under `chesser-server` and the
  `fromService.name` in `chesser-app` matching, or the auto-wiring breaks.
