// Runs the chess search off the main thread so the board stays responsive.
importScripts('engine.js');

self.onmessage = function (e) {
  const { id, type, state, difficulty, depth } = e.data;
  try {
    if (type === 'move') {
      const move = self.Chess.chooseMove(state, difficulty);
      self.postMessage({ id, move });
    } else if (type === 'analyze') {
      const result = self.Chess.analyze(state, depth);
      self.postMessage({ id, result });
    }
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
