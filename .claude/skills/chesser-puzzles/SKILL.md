---
name: chesser-puzzles
description: How Chesser's puzzle system works — data format, the four types, nature-based difficulty, the played-move grade ladder, the annotated move list, auto-ramping difficulty, and how puzzles are generated/re-graded. Use when adding, grading, generating, or debugging puzzles in this repo.
---

# Chesser puzzles

## Data — `window.PUZZLES` in `puzzles.js`
Each puzzle is a flat object:
```json
{"fen":"…","type":"opening|mate|tactic|endgame","level":"easy|normal|hard","theme":"…",
 "solution":"e2e4","line":["d2d4","d7d5",…],"grades":["best","mistake",…]}
```
- `solution` — UCI of the winning move. **Mate puzzles have NO `solution`**: they're solved
  by delivering *any* checkmate (`puzzleSolved` checks `gameStatus(ns) === 'checkmate'`).
- `line` + `grades` — **openings only**: the moves from move 1 that led to the position, each
  pre-graded (an analyzer symbol) so the move list can show the graded lead-up instantly.
  `line` replays from the standard start FEN to exactly `fen`; `grades.length === line.length`.
- Current counts: mate/tactic/endgame = **600 each (200/level)**; opening ≈ 314. Total ~2114.

## The four types
- **opening** — "punish the early blunder": a real opening position (a few sensible moves in)
  where one side blundered and you find the winning move. Carries the graded line.
- **mate** — find a checkmate (the set is mate-in-1).
- **tactic** / **endgame** — win material by a one-move capture/combination. (These two are
  generated from the same "material win" pool; tactic ≈ fuller board, endgame ≈ few pieces —
  the distinction is loose.)

## Difficulty = the NATURE of the winning move (not raw strength)
Ranked per type then split into thirds (Easy/Normal/Hard):
- **Easy** = take a piece (a capture).
- **Normal** = a mate or a *forcing* tactic (check / fork / capturing-check).
- **Hard** = a **quiet positional** move (no capture, no check) — floats to the top of Hard;
  when a type has too few quiet moves, the *trickiest* forcing moves fill the rest so Hard
  stays stocked. (`rank = nature*1000 + trickiness`, then tertiles.)
> Note: the puzzle set is overwhelmingly material-winning captures, so genuinely positional
> puzzles are scarce (only endgames have many). A pure positional-only Hard isn't feasible
> with the built-in engine — see the generation caveats below.

## Played-move grade ladder — `gradeAttempt(state, move, isSolution)` in `app.js`
Grades the move you play by the resulting eval (mover's side), using the analyzer `MARKS`
symbols. Order matters:
1. move **forces mate** (immediate `checkmate` OR eval ≥ +5000) — immediate mate → **Great**;
   a *mating attack* that forces mate a few moves out → **Brilliant**.
2. wins a **piece or more** (afterStm ≥ +200) → **Best**.
3. it's the intended quiet/positional solution → **Best**.
4. wins ~**a pawn** (≥ +90) → **Inaccuracy** (`dubious`, ?!).
5. gains a little **space/development** (≥ +35) → **Mistake**.
6. **neutral** (missed the win, lost nothing, ≥ −35) → **Miss**.
7. otherwise (**loses material**) → **Blunder**.
This is the ladder the user tuned by hand; keep the semantics if you touch thresholds.

## The annotated move list (under the board)
- `#puzzle-moves` panel. `puzzleMovesHeader(p)` replays an opening's `line` and renders each
  ply with its stored grade (compact, badge-only, faded); the solver's own moves render via
  `pushPuzzleMove(moveTxt, markKey)` with the `gradeAttempt` symbol.
- Proper move numbers (`1.` white / `1…` black) via `plyLabel`. It's a **notation list, not a
  chat** — no "Tom said…" lines.

## Auto-ramping difficulty
Three clean solves in a row bump Easy→Normal→Hard (`puzzleLevelRun`, `PZ_LEVEL_UP_AFTER`),
shown as a `⬆️ Leveled up` row. A miss or a manual level pick resets the climb.

## Generation & re-grading (build scripts, run outside the repo)
Puzzles are **engine-verified with `engine.js`** (Node: `global.window = global; require('./engine.js')`).
Common recipe for a material/tactic puzzle: scatter pieces → require a *unique decisive best
move* (depth-2 screen, depth-4 confirm, big eval + gap ≥ ~250, still winning after the reply).
Mate puzzles: random positions where some legal move gives checkmate. Openings: random
self-play (favor development, occasional blunder), keep positions with a one-move win, record
the line, grade each move.
- **Yields:** mate is fast (~700/12s); material ~0.5–0.7/s; **openings and positional
  puzzles are very slow** (~0.03–0.3/s) — reaching hundreds needs many parallel workers over
  minutes, and the weak engine limits positional quality.
- After generating, **re-grade difficulty by nature** (rank = nature*1000 + trickiness,
  tertiles per type) and preserve `line`/`grades` on openings when rewriting `puzzles.js`.
- Always validate before committing: every mate has a mate-in-1, every non-mate `solution` is
  legal, opening `line` replays to `fen`, `grades.length === line.length`.
