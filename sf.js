// Thin wrapper around the real Stockfish 16 engine (loaded as a Web Worker).
// Exposes window.SF with a promise-based UCI search API. Calls are serialized.
(function () {
  let worker = null;
  let loaded = false;
  const listeners = [];
  let chain = Promise.resolve(); // serializes go() calls

  function ensure() {
    if (worker) return;
    // The single-threaded build reads the .wasm name from its URL hash.
    worker = new Worker('vendor/stockfish-nnue-16-single.js#stockfish-nnue-16-single.wasm');
    worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : '';
      if (line.startsWith('uciok') || line.startsWith('readyok')) loaded = true;
      for (const fn of listeners.slice()) fn(line);
    };
    worker.onerror = (err) => console.error('Stockfish worker error:', err);
    worker.postMessage('uci');
    worker.postMessage('isready');
  }

  function addListener(fn) { listeners.push(fn); }
  function removeListener(fn) {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  }

  function matchInt(line, re) {
    const m = line.match(re);
    return m ? parseInt(m[1], 10) : null;
  }

  // Search a FEN. Returns { bestmove, lines:[{multipv, cp, mate, pv:[uci...]}] }.
  // cp/mate are from the side-to-move's perspective (UCI convention).
  function go(fen, opts) {
    const depth = (opts && opts.depth) || 14;
    const multipv = (opts && opts.multipv) || 1;
    const elo = opts && opts.elo; // cap playing strength to this Elo (else full power)
    ensure();
    chain = chain.then(() => new Promise((resolve) => {
      const byPv = {};
      const onLine = (line) => {
        if (line.startsWith('info') && line.indexOf(' pv ') !== -1) {
          const mpv = matchInt(line, /multipv (\d+)/) || 1;
          const cp = matchInt(line, /score cp (-?\d+)/);
          const mate = matchInt(line, /score mate (-?\d+)/);
          const pv = line.split(' pv ')[1].trim().split(/\s+/);
          byPv[mpv] = { multipv: mpv, cp, mate, pv };
        } else if (line.startsWith('bestmove')) {
          removeListener(onLine);
          const best = line.split(/\s+/)[1];
          const lines = Object.keys(byPv)
            .map(Number).sort((a, b) => a - b).map((k) => byPv[k]);
          resolve({ bestmove: best && best !== '(none)' ? best : null, lines });
        }
      };
      addListener(onLine);
      // Set strength on every search so analysis (no elo) always runs full power.
      if (elo) {
        worker.postMessage('setoption name UCI_LimitStrength value true');
        worker.postMessage('setoption name UCI_Elo value ' + elo);
      } else {
        worker.postMessage('setoption name UCI_LimitStrength value false');
      }
      worker.postMessage('setoption name MultiPV value ' + multipv);
      worker.postMessage('position fen ' + fen);
      worker.postMessage('go depth ' + depth);
    }));
    return chain;
  }

  // Convert a UCI score object to centipawns (mate -> large signed value).
  function cpify(line) {
    if (line == null) return 0;
    if (line.mate != null) {
      const sign = line.mate >= 0 ? 1 : -1;
      return sign * (100000 - Math.abs(line.mate) * 100);
    }
    return line.cp != null ? line.cp : 0;
  }

  window.SF = { go, preload: ensure, cpify, isLoaded: () => loaded };
})();
