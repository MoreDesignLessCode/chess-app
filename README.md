# Chesser

A chess web app built in vanilla JavaScript. Play against friends (pass and play), against
six AI difficulty levels, against character bots, or against a real person live. It also has a
Stockfish-powered analyzer, daily puzzles, a membership system (Free / Bronze / Silver / Gold),
and an in-app chat with Tom, a scripted character.

The chess engine is the real Stockfish 16 (WASM), running in a Web Worker. The move
classification, evaluation bar, and game review all come from that engine.

## Running it

You need [Node.js](https://nodejs.org/) (v18 or newer; developed on v24).

```bash
npm install
npm run online
```

This starts `online-server.js`, which serves the app, hosts the live-play WebSocket, and
handles the demo payment endpoint, all on one port (default `4180`). Open
`http://localhost:4180` in a browser. To play a live online game, open it in two windows.

To run it as a desktop app (Electron):

```bash
npm start
```

## How the code is laid out

| File | What it does |
| --- | --- |
| `index.html` | Page structure: home screen, board, all modals |
| `styles.css` | All styling |
| `app.js` | Main app logic: UI, game flow, membership, chat, analyzer, puzzles |
| `engine.js` | Chess rules and the built-in AI (`globalThis.Chess`) |
| `sf.js` | Wrapper around the Stockfish WASM worker (`window.SF`) |
| `worker.js` | Web Worker entry for the engine |
| `online-server.js` | Node server: static files, live-play WebSocket, demo payment API |
| `music.js` | Background music and the playable piano |
| `vendor/` | Stockfish 16 NNUE build (`.js` + `.wasm`) |
| `electron/main.js` | Electron wrapper for the desktop build |
| `serve.py`, `start.sh` | Alternate ways to serve the app locally |

## Membership tiers

- **Free**: play with friends, AI, and puzzles (10 a day)
- **Bronze**: adds the analyzer, bots, and unlimited puzzles
- **Silver**: adds packs and everything below
- **Gold**: adds Tom and chat

Membership state lives in the browser's `localStorage`. The payment flow is a demo only; no
real charge is made. Wiring in a real payment provider is one of the steps toward production.

## Notes on turning this into a production app

The app currently runs entirely client-side, with `localStorage` for accounts and membership
and an in-memory Node server for live play. The main gaps to close for production:

- Real user accounts and auth on a backend, rather than `localStorage`
- A real payment provider (Stripe or similar) behind the payment endpoint
- Persistent storage for games, puzzles, and membership
- A build step and asset bundling
- Automated tests

## License

MIT. See [LICENSE](LICENSE).
