# Deploying Chesser to the web

This puts Chesser online at a real URL, for free, and gives you **two commands** you run
yourself whenever you want to push changes. Your code stays on your computer — nothing is
pushed to GitHub or made public except the built website.

There are two pieces:

| Piece | What it is | Host | Needed for |
| --- | --- | --- | --- |
| **The app** | the chess website (all the HTML/JS) | **Netlify** (free) | everything — this is your URL |
| **The server** | a tiny Node program (`online-server.js`) | **Fly.io** (free) | live online play vs strangers + World chat |

The app works fully on its own — play vs the computer, puzzles, lessons, achievements,
packs, membership all run in the browser. The server is **only** needed for live games
against strangers and the World chat room. If you skip the server, those two features just
show a friendly "use Lichess" message and everything else is unaffected.

---

## Part 1 — Put the app online (Netlify)

**One-time setup**

1. Install the Netlify command-line tool:
   ```bash
   npm install -g netlify-cli
   ```
2. Log in (opens your browser; create a free account if you don't have one):
   ```bash
   netlify login
   ```
3. From the `chess-app` folder, connect a new site:
   ```bash
   netlify init
   ```
   Choose **"Create & configure a new site"**, pick your team, and accept a name (this
   becomes your URL, e.g. `chesser-abc.netlify.app`). When it asks about build settings,
   just accept them — `netlify.toml` already has them.

**Deploy (this is the command you re-run forever)**

```bash
npm run deploy
```

That builds `dist/` and uploads it. It prints a **Website URL** at the end — that's your
link. Open it, share it, done. Any time you change the code, run `npm run deploy` again.

> You can stop here if you don't care about live online play against strangers.

---

## Part 2 — Put the online server up (Fly.io)

This is what powers **live games vs strangers** and the **World chat**. Fly lets you deploy
straight from your computer (no GitHub needed).

**One-time setup**

1. Install the Fly command-line tool:
   ```bash
   # macOS
   brew install flyctl
   # or, without Homebrew:
   curl -L https://fly.io/install.sh | sh
   ```
2. Sign up / log in (opens your browser):
   ```bash
   fly auth signup      # first time
   fly auth login        # after that
   ```
   Fly's free allowance covers a tiny server like this, but they do ask for a card at signup
   to stop abuse.
3. Create the app (from the `chess-app` folder). Fly reads the included `Dockerfile` and
   `fly.toml`:
   ```bash
   fly launch --no-deploy
   ```
   - When it asks to **copy the existing configuration**, say **Yes**.
   - If the name `chesser-server` is taken, it'll ask for a new one — pick anything unique
     and remember it.
   - Say **No** to a database/Redis if asked.

**Deploy (re-run this whenever you change the server)**

```bash
npm run deploy:server
```

When it finishes, your server URL is `https://<your-app-name>.fly.dev`. Note the host part
(e.g. `chesser-server.fly.dev`).

---

## Part 3 — Connect the app to the server

Tell the app where the server lives:

1. Open `config.js` and set the host you got from Fly (host only — no `https://`):
   ```js
   window.CHESSER_SERVER = "chesser-server.fly.dev";
   ```
2. Re-deploy the app:
   ```bash
   npm run deploy
   ```

Now live online play and World chat work on your public URL. 🎉

---

## Everyday updates (the whole pipeline)

- Changed the game/UI? → `npm run deploy`
- Changed `online-server.js`? → `npm run deploy:server`
- Both are safe to run as often as you like.

## Test the built site locally first (optional)

```bash
npm run build
npx serve dist      # then open the printed http://localhost:... address
```

## Notes

- **Free Fly servers sleep when idle** and take a few seconds to wake on the first
  connection — normal, and it costs nothing while asleep.
- **Prefer not to use Fly for the server?** The included `Dockerfile` also works on
  [Render](https://render.com) (New → Web Service → Docker) or Koyeb. Those hosts deploy
  from a Git repo instead of your local folder, so you'd connect a **private** GitHub repo.
  Whatever you use, put its host into `config.js` and re-run `npm run deploy`.
- Nothing here is committed publicly by these commands — Netlify uploads only the built
  `dist/` website, and Fly builds an image from your local files. Your source stays yours.
