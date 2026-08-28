# Chesser — project memory

Chesser is a **vanilla-JS chess web app** for kids (built with an 8-year-old learning to
code). No framework, no build step for the app itself — plain HTML/CSS/JS loaded by
`index.html`. This file is the durable context for anyone (human or Claude) picking the
project up. Deeper how-to lives in `.claude/skills/` and `docs/PROJECT_NOTES.md`.

## Run it
- Play locally (app + online server together): `npm run online` → open `http://localhost:4180`
  (open two windows to test a live game). Never start a dev server any other way.
- Build the static site only: `npm run build` (assembles `dist/` via `build.js`).
- Desktop build: Electron (`npm start`) — see `electron/`.

## Files (all in repo root)
- `index.html` — the whole UI (screens, modals, board container).
- `app.js` — **all game logic** (~3k+ lines): board render, modes, puzzles, achievements,
  packs, membership, chat, online play, analyzer. Big single file by design.
- `engine.js` — `globalThis.Chess`: move gen, `fromFEN`/`toFEN`, `legalMoves`, `applyMove`,
  `gameStatus`, `inCheck`, `analyze(state, depth)` (negamax + material/PST eval),
  `moveToText`, `uciToMove`, `materialForColor`, `PIECE_VALUE`. This is the *built-in* weak AI.
- `sf.js` — `window.SF`: **real Stockfish 16 WASM** in a Web Worker, **single-threaded**
  (`vendor/stockfish-nnue-16-single.js`) so it needs no COOP/COEP headers → static-hostable.
- `worker.js` — built-in AI worker (uses engine.js).
- `puzzles.js` — `window.PUZZLES`, the whole puzzle set (see the puzzles skill).
- `achievements.js` — `window.ACH_TOPICS` (50 topics × 6 tiers = 300 achievements).
- `config.js` — `window.CHESSER_SERVER` (online server host; empty = same origin).
- `online-server.js` — Node `http`+`ws` server: WebSocket matchmaking + World chat +
  `/api/pay` demo stub. Binds `process.env.PORT || 4180`.
- `styles.css`, `music.js`, `vendor/` (Stockfish build).

## Key systems (details in the skills)
- **Puzzles** — 4 types (opening / mate / tactic / endgame). Difficulty by the *nature* of the
  winning move; a per-move analyzer-symbol grade ladder; an annotated move list under the
  board; auto-ramping difficulty. See `.claude/skills/chesser-puzzles/`.
- **Achievements** — 300 trophies, a star-claim currency, rewards at 500 (🌟 Star Legend
  badge in the topbar) and 1000 (3 packs/day), a completion-percent chip.
- **Deploy** — static app + online server, both on Render, deployed by `git push`. See
  `.claude/skills/chesser-deploy/`.

## Conventions
- Persistence is `localStorage`; keys never reset on restart (`chesser_*`, `chessup_*`).
- Fantasy is OK where the user chose it (e.g. Tom the shark bot "rating 4000"), but the
  software version must stay truthful ("Stockfish 16"); payments are local-only, no real
  charge, no card collected.
- The app is static-deployable; only live online-vs-strangers and World chat need the Node
  server, and they degrade gracefully (show "use Lichess") when it's unreachable.
- Repo: `github.com/MoreDesignLessCode/chess-app` (public). Commit identity: pankaj gupta /
  pankaj84.iit@gmail.com. End commit messages with the Claude `Co-Authored-By` trailer.
