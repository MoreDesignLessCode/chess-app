# Chesser — project notes & decisions

A running memory of what was built and the decisions behind it, so context survives across
chats/accounts. Newest work is roughly at the bottom. Companion to `CLAUDE.md` and the
`.claude/skills/`.

## Who / what
- Chesser is a vanilla-JS chess web app built iteratively by a parent with an 8-year-old
  learning to code. Requests are terse/typo-heavy; the intent is a polished, kid-friendly app
  that is **truthful** (real software names, no real-money charges) while allowing chosen
  fantasy (e.g. Tom the shark bot).
- Repo: `github.com/MoreDesignLessCode/chess-app` (public).

## Achievements & stars
- **300 achievements** = `window.ACH_TOPICS` in `achievements.js`: 50 topics × 6 tiers
  `[name, desc, stat, need]`. Flattened to `ACH_ALL` with tier index and star value.
- **Star-claim currency**: each unlocked achievement has a Claim button worth stars by tier
  position `TIER_STARS = [1,2,3,5,10,20]`; stars accumulate into a balance.
- **Two rewards**: 500 stars → 🌟 **Star Legend** badge, shown in the **topbar badges area**
  (next to Sign in), *not* in the member chip. 1000 stars → **3 packs a day**. The
  achievements screen shows **only the next reward** (hides Star Legend once earned; at 1000
  shows "All star rewards earned!").
- Real chess rating thresholds in the Rating topic: Climber 1200, Skilled 1500, Expert 1900,
  Master 2100, Grandmaster 2500. Rare Finds are all rares-based (1/10/25/50/75/100). Tom topic
  = all chat (`tomChats`), no play-Tom achievements.
- A **completion-percent** chip (`0%…`) sits next to the "X / 300 unlocked" count.
- Persistence keys (never reset): `chesser_stats`, `chesser_ach`, `chesser_claimed`,
  `chesser_reward500`, `chesser_reward1000`; membership `chessup_*`; etc.

## Analyzer "Chaos" label
- Added one move mark **Chaos** (`MARKS.chaos`, symbol `?!?`) = a wild sacrifice that keeps
  the eval about even (`netSac ≥ 100 && drop ≤ 0.08 && |playedValue| ≤ 90`) in
  `classifyPly`.

## Deploy pipeline (chosen: Render)
- The app is fully static-deployable (single-threaded Stockfish WASM, relative paths). Only
  live online play + World chat need the Node server, which degrades gracefully.
- Built a **Render Blueprint** (`render.yaml`): static `chesser-app` + docker `chesser-server`
  (`online-server.js`), auto-wired via `CHESSER_SERVER` → `build.js` → `dist/config.js`.
  Pipeline = `git push`. (Earlier drafts targeted Netlify + Fly; the project moved to Render
  once the GitHub repo existed. `netlify.toml`/`Dockerfile` remain; `fly.toml` was removed.)
- See `.claude/skills/chesser-deploy/` and `DEPLOY.md`.

## Opening puzzle type
- Added a 4th puzzle type **opening** ("punish the early blunder"): engine-verified positions
  a few moves into a game where a one-move win exists. Wired a `♘ Opening` button, status
  label, `puzTypes` stat.
- Openings carry their **line from move 1** plus a pre-computed **grade per move**, so the
  move list shows the graded lead-up (how the blunder happened) then your move.

## The move list & grading (heavily iterated with the user)
- Under-board **annotated move list** (`#puzzle-moves`): a **notation list, not a chat** —
  move numbers + move in notation + the analyzer `MARKS` badge. Openings prepend the graded
  line from move 1.
- **Auto-ramping difficulty**: 3 clean solves → level up (Easy→Normal→Hard).
- **Played-move grade ladder** (`gradeAttempt`), tuned by the user in several passes to:
  - **Brilliant** = a *mating attack* that forces mate (not the obvious immediate mate).
  - **Great** = an immediate **mate-in-1** (obvious mate).
  - **Best** = wins a **piece** (a tactic) OR a quiet positional intended win.
  - **Inaccuracy** = wins ~a pawn. **Mistake** = gains a little (space/development).
  - **Miss** = neutral (missed the win, lost nothing). **Blunder** = loses material.
  - Rationale from the user: "queen & rook both hang, take the rook" is still Good/Very-Good,
    not a blunder; only winning *nothing* is a blunder.

## Difficulty = nature of the winning move
- Easy = take a piece; Normal = mate/forcing tactic; **Hard = quiet positional** (floats to
  the top of Hard; trickiest forcing moves fill the rest so Hard stays stocked). The user
  specifically wanted Hard to be positional, not just capturing.

## Puzzle counts
- Brought **mate / tactic / endgame to 600 each (200 per level)** via engine-verified
  generation. **Openings** grew 144 → ~314 (opening generation is ~10× slower than the other
  types, so 600 openings wasn't practical without a long run). Total ~2114 puzzles.
- Known limitation: dense middlegame tactics and true positional puzzles are very slow to
  generate with the built-in weak engine; tactic/endgame fills come from a shared material-win
  pool, so some "tactic" puzzles feel endgame-ish. A stronger engine (the bundled Stockfish)
  or curation would be needed for better dense-tactic / positional sets.

## Verification habit
- Changes are verified live in the in-app browser preview (`http://localhost:4180`): load the
  relevant screen, exercise it via JS, check console for errors, screenshot. Puzzle data is
  validated in Node before committing (legal solutions, replayable lines, aligned grades).
