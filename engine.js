// Self-contained chess rules engine + AI + analysis.
// Board: array[64], index 0 = a8 ... 63 = h1.
// Pieces: white = PNBRQK, black = pnbrqk, empty = ''.

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function startBoard() {
  return [
    'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
    'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',
    'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',
  ];
}

function isWhite(p) { return p !== '' && p === p.toUpperCase(); }
function isBlack(p) { return p !== '' && p === p.toLowerCase(); }
function colorOf(p) { return p === '' ? null : (isWhite(p) ? 'w' : 'b'); }

function rc(idx) { return { r: Math.floor(idx / 8), c: idx % 8 }; }
function idx(r, c) { return r * 8 + c; }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function squareName(i) {
  const { r, c } = rc(i);
  return FILES[c] + (8 - r);
}

// A game State holds everything needed to reproduce a position.
function newState() {
  return {
    board: startBoard(),
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null, // index of the square that can be captured en passant
    halfmove: 0,
    fullmove: 1,
  };
}

function cloneState(s) {
  return {
    board: s.board.slice(),
    turn: s.turn,
    castling: { ...s.castling },
    enPassant: s.enPassant,
    halfmove: s.halfmove,
    fullmove: s.fullmove,
  };
}

const KNIGHT_DELTAS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_DELTAS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Pseudo-legal move generation for the side to move (ignores leaving own king in check).
function pseudoMoves(s) {
  const moves = [];
  const { board, turn } = s;
  const own = turn;

  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p === '' || colorOf(p) !== own) continue;
    const { r, c } = rc(i);
    const type = p.toLowerCase();

    if (type === 'p') {
      const dir = own === 'w' ? -1 : 1;
      const startRow = own === 'w' ? 6 : 1;
      const promoRow = own === 'w' ? 0 : 7;
      // forward one
      const r1 = r + dir;
      if (inBounds(r1, c) && board[idx(r1, c)] === '') {
        addPawnMove(moves, i, idx(r1, c), r1 === promoRow);
        // forward two
        if (r === startRow && board[idx(r + 2 * dir, c)] === '') {
          moves.push({ from: i, to: idx(r + 2 * dir, c), double: true });
        }
      }
      // captures
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (!inBounds(r1, cc)) continue;
        const target = idx(r1, cc);
        if (board[target] !== '' && colorOf(board[target]) !== own) {
          addPawnMove(moves, i, target, r1 === promoRow);
        } else if (target === s.enPassant) {
          moves.push({ from: i, to: target, enPassant: true });
        }
      }
    } else if (type === 'n') {
      for (const [dr, dc] of KNIGHT_DELTAS) {
        const nr = r + dr, nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const t = idx(nr, nc);
        if (board[t] === '' || colorOf(board[t]) !== own) moves.push({ from: i, to: t });
      }
    } else if (type === 'k') {
      for (const [dr, dc] of KING_DELTAS) {
        const nr = r + dr, nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const t = idx(nr, nc);
        if (board[t] === '' || colorOf(board[t]) !== own) moves.push({ from: i, to: t });
      }
      addCastling(s, moves, i);
    } else {
      const dirs = type === 'b' ? BISHOP_DIRS : type === 'r' ? ROOK_DIRS : BISHOP_DIRS.concat(ROOK_DIRS);
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
          const t = idx(nr, nc);
          if (board[t] === '') {
            moves.push({ from: i, to: t });
          } else {
            if (colorOf(board[t]) !== own) moves.push({ from: i, to: t });
            break;
          }
          nr += dr; nc += dc;
        }
      }
    }
  }
  return moves;
}

function addPawnMove(moves, from, to, isPromo) {
  if (isPromo) {
    for (const promo of ['q', 'r', 'b', 'n']) {
      moves.push({ from, to, promotion: promo });
    }
  } else {
    moves.push({ from, to });
  }
}

function addCastling(s, moves, kingIdx) {
  const own = s.turn;
  const opp = own === 'w' ? 'b' : 'w';
  // King must not be in check now; squares between must be empty and not attacked.
  if (isSquareAttacked(s.board, kingIdx, opp)) return;
  const row = own === 'w' ? 7 : 0;
  if (kingIdx !== idx(row, 4)) return;

  const kSide = own === 'w' ? s.castling.wK : s.castling.bK;
  const qSide = own === 'w' ? s.castling.wQ : s.castling.bQ;

  if (kSide) {
    const f1 = idx(row, 5), f2 = idx(row, 6), rookSq = idx(row, 7);
    const rook = s.board[rookSq];
    if (s.board[f1] === '' && s.board[f2] === '' && rook.toLowerCase() === 'r' && colorOf(rook) === own) {
      if (!isSquareAttacked(s.board, f1, opp) && !isSquareAttacked(s.board, f2, opp)) {
        moves.push({ from: kingIdx, to: f2, castle: 'K' });
      }
    }
  }
  if (qSide) {
    const d1 = idx(row, 3), d2 = idx(row, 2), b = idx(row, 1), rookSq = idx(row, 0);
    const rook = s.board[rookSq];
    if (s.board[d1] === '' && s.board[d2] === '' && s.board[b] === '' && rook.toLowerCase() === 'r' && colorOf(rook) === own) {
      if (!isSquareAttacked(s.board, d1, opp) && !isSquareAttacked(s.board, d2, opp)) {
        moves.push({ from: kingIdx, to: d2, castle: 'Q' });
      }
    }
  }
}

// Is `sq` attacked by side `byColor` on the given board?
function isSquareAttacked(board, sq, byColor) {
  const { r, c } = rc(sq);
  // pawns
  const pawnDir = byColor === 'w' ? 1 : -1; // attacker pawn sits one row toward its own side
  for (const dc of [-1, 1]) {
    const nr = r + pawnDir, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[idx(nr, nc)];
      if (p !== '' && colorOf(p) === byColor && p.toLowerCase() === 'p') return true;
    }
  }
  // knights
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = board[idx(nr, nc)];
    if (p !== '' && colorOf(p) === byColor && p.toLowerCase() === 'n') return true;
  }
  // king
  for (const [dr, dc] of KING_DELTAS) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = board[idx(nr, nc)];
    if (p !== '' && colorOf(p) === byColor && p.toLowerCase() === 'k') return true;
  }
  // sliding: bishop/queen diagonals
  for (const [dr, dc] of BISHOP_DIRS) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[idx(nr, nc)];
      if (p !== '') {
        if (colorOf(p) === byColor && (p.toLowerCase() === 'b' || p.toLowerCase() === 'q')) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  // sliding: rook/queen straights
  for (const [dr, dc] of ROOK_DIRS) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[idx(nr, nc)];
      if (p !== '') {
        if (colorOf(p) === byColor && (p.toLowerCase() === 'r' || p.toLowerCase() === 'q')) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
}

function kingIndex(board, color) {
  const k = color === 'w' ? 'K' : 'k';
  for (let i = 0; i < 64; i++) if (board[i] === k) return i;
  return -1;
}

function inCheck(s, color) {
  const ki = kingIndex(s.board, color);
  if (ki === -1) return false;
  return isSquareAttacked(s.board, ki, color === 'w' ? 'b' : 'w');
}

// Apply a move to a *clone* and return the new state. Does not validate legality.
function applyMove(s, move) {
  const ns = cloneState(s);
  const b = ns.board;
  const piece = b[move.from];
  const own = ns.turn;

  ns.enPassant = null;
  ns.halfmove++;

  const isPawn = piece.toLowerCase() === 'p';
  const isCapture = b[move.to] !== '' || move.enPassant;
  if (isPawn || isCapture) ns.halfmove = 0;

  // move the piece
  b[move.to] = piece;
  b[move.from] = '';

  if (move.enPassant) {
    const { r } = rc(move.to);
    const capRow = own === 'w' ? r + 1 : r - 1;
    b[idx(capRow, rc(move.to).c)] = '';
  }

  if (move.double) {
    const { r, c } = rc(move.from);
    ns.enPassant = idx(own === 'w' ? r - 1 : r + 1, c);
  }

  if (move.promotion) {
    b[move.to] = own === 'w' ? move.promotion.toUpperCase() : move.promotion;
  }

  if (move.castle) {
    const row = own === 'w' ? 7 : 0;
    if (move.castle === 'K') {
      b[idx(row, 5)] = b[idx(row, 7)];
      b[idx(row, 7)] = '';
    } else {
      b[idx(row, 3)] = b[idx(row, 0)];
      b[idx(row, 0)] = '';
    }
  }

  // update castling rights
  if (piece === 'K') { ns.castling.wK = false; ns.castling.wQ = false; }
  if (piece === 'k') { ns.castling.bK = false; ns.castling.bQ = false; }
  if (move.from === idx(7, 0) || move.to === idx(7, 0)) ns.castling.wQ = false;
  if (move.from === idx(7, 7) || move.to === idx(7, 7)) ns.castling.wK = false;
  if (move.from === idx(0, 0) || move.to === idx(0, 0)) ns.castling.bQ = false;
  if (move.from === idx(0, 7) || move.to === idx(0, 7)) ns.castling.bK = false;

  if (own === 'b') ns.fullmove++;
  ns.turn = own === 'w' ? 'b' : 'w';
  return ns;
}

// Fully legal moves for the side to move.
function legalMoves(s) {
  const out = [];
  for (const m of pseudoMoves(s)) {
    const ns = applyMove(s, m);
    if (!inCheck(ns, s.turn)) out.push(m);
  }
  return out;
}

function legalMovesFrom(s, from) {
  return legalMoves(s).filter(m => m.from === from);
}

// 'checkmate' | 'stalemate' | 'check' | 'normal'
function gameStatus(s) {
  const moves = legalMoves(s);
  const checked = inCheck(s, s.turn);
  if (moves.length === 0) return checked ? 'checkmate' : 'stalemate';
  if (s.halfmove >= 100) return 'fifty-move';
  return checked ? 'check' : 'normal';
}

// ---- AI + evaluation ----

const PIECE_VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables (from white's perspective, index 0 = a8).
const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

function mirror(i) {
  const { r, c } = rc(i);
  return idx(7 - r, c);
}

// Static evaluation in centipawns, from white's perspective.
function evaluate(s) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (p === '') continue;
    const type = p.toLowerCase();
    const val = PIECE_VALUE[type];
    const pst = PST[type];
    if (isWhite(p)) {
      score += val + pst[i];
    } else {
      score -= val + pst[mirror(i)];
    }
  }
  return score;
}

// Negamax with alpha-beta. Returns score from the perspective of side to move.
function negamax(s, depth, alpha, beta) {
  const moves = legalMoves(s);
  if (moves.length === 0) {
    if (inCheck(s, s.turn)) return -100000 - depth; // checkmate; prefer faster mates
    return 0; // stalemate
  }
  if (depth === 0) {
    const e = evaluate(s);
    return s.turn === 'w' ? e : -e;
  }
  // simple move ordering: captures first
  moves.sort((a, b) => captureScore(s, b) - captureScore(s, a));
  let best = -Infinity;
  for (const m of moves) {
    const ns = applyMove(s, m);
    const score = -negamax(ns, depth - 1, -beta, -alpha);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function captureScore(s, m) {
  const victim = s.board[m.to];
  const attacker = s.board[m.from];
  if (victim === '') return 0;
  return PIECE_VALUE[victim.toLowerCase()] - PIECE_VALUE[attacker.toLowerCase()] / 10;
}

const DIFFICULTIES = {
  worst: { depth: 2, randomness: 0, blunder: 0, pickWorst: true }, // Worst Fish: sees 1 reply, then picks the move that loses the most
  newbie: { depth: 1, randomness: 1.6, blunder: 0.7 },             // New to Chess: mostly random, very weak
  beginner: { depth: 1, randomness: 1.0, blunder: 0.45 },
  'very-easy': { depth: 1, randomness: 0.7, blunder: 0.25 },
  easy: { depth: 2, randomness: 0.5, blunder: 0.12 },
  intermediate: { depth: 2, randomness: 0.15, blunder: 0.03 },
  advanced: { depth: 3, randomness: 0, blunder: 0 },
  master: { depth: 4, randomness: 0, blunder: 0 },
};

// Choose a move for the side to move at a given difficulty.
function chooseMove(s, difficulty) {
  const cfg = DIFFICULTIES[difficulty] || DIFFICULTIES.intermediate;
  const moves = legalMoves(s);
  if (moves.length === 0) return null;

  // Occasionally play a random legal move (simulates weaker play / blunders).
  if (cfg.blunder > 0 && Math.random() < cfg.blunder) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const scored = moves.map(m => {
    const ns = applyMove(s, m);
    const score = -negamax(ns, cfg.depth - 1, -Infinity, Infinity);
    const noise = cfg.randomness > 0 ? (Math.random() - 0.5) * cfg.randomness * 200 : 0;
    return { move: m, score: score + noise };
  });
  scored.sort((a, b) => b.score - a.score); // best first

  // "Worst Fish": almost always play THE worst legal move (occasionally the 2nd-worst).
  // Kept at 97% so its moves review as Mistakes/Blunders, not lucky good moves.
  if (cfg.pickWorst) {
    if (Math.random() < 0.97) {
      const k = Math.random() < 0.75 ? 1 : 2;   // usually the single worst move
      const worst = scored.slice(-k);
      return worst[Math.floor(Math.random() * worst.length)].move;
    }
    return moves[Math.floor(Math.random() * moves.length)]; // very rarely, just anything
  }
  return scored[0].move;
}

// Analysis: best move + evaluation (from white's perspective), to a fixed depth.
function analyze(s, depth = 4) {
  const moves = legalMoves(s);
  if (moves.length === 0) {
    return { bestMove: null, evalCp: inCheck(s, s.turn) ? (s.turn === 'w' ? -100000 : 100000) : 0, lines: [] };
  }
  const scored = moves.map(m => {
    const ns = applyMove(s, m);
    const score = -negamax(ns, depth - 1, -Infinity, Infinity);
    return { move: m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  // score is from side-to-move perspective; convert to white perspective
  const evalCp = s.turn === 'w' ? best.score : -best.score;
  return {
    bestMove: best.move,
    evalCp,
    lines: scored.slice(0, 3).map(x => ({
      move: x.move,
      evalCp: s.turn === 'w' ? x.score : -x.score,
    })),
  };
}

// SAN-ish notation for a move (good enough for the move list).
function moveToText(s, m) {
  const piece = s.board[m.from];
  const type = piece.toLowerCase();
  if (m.castle === 'K') return 'O-O';
  if (m.castle === 'Q') return 'O-O-O';
  const capture = s.board[m.to] !== '' || m.enPassant;
  const dest = squareName(m.to);
  let txt;
  if (type === 'p') {
    txt = capture ? FILES[rc(m.from).c] + 'x' + dest : dest;
    if (m.promotion) txt += '=' + m.promotion.toUpperCase();
  } else {
    txt = piece.toUpperCase() + (capture ? 'x' : '') + dest;
  }
  const ns = applyMove(s, m);
  const st = gameStatus(ns);
  if (st === 'checkmate') txt += '#';
  else if (st === 'check') txt += '+';
  return txt;
}

// ---- FEN + UCI interop (for talking to Stockfish) ----

function toFEN(s) {
  let fen = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = s.board[idx(r, c)];
      if (p === '') { empty++; continue; }
      if (empty) { fen += empty; empty = 0; }
      fen += p;
    }
    if (empty) fen += empty;
    if (r < 7) fen += '/';
  }
  fen += ' ' + s.turn + ' ';
  let cr = '';
  if (s.castling.wK) cr += 'K';
  if (s.castling.wQ) cr += 'Q';
  if (s.castling.bK) cr += 'k';
  if (s.castling.bQ) cr += 'q';
  fen += (cr || '-') + ' ';
  fen += (s.enPassant != null ? squareName(s.enPassant) : '-') + ' ';
  fen += s.halfmove + ' ' + s.fullmove;
  return fen;
}

function squareToIndex(name) {
  const c = FILES.indexOf(name[0]);
  const r = 8 - parseInt(name[1], 10);
  return idx(r, c);
}

// Parse a FEN string into a game state (used to load puzzles).
function fromFEN(fen) {
  const parts = fen.trim().split(/\s+/);
  const board = new Array(64).fill('');
  const rows = parts[0].split('/');
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) { c += parseInt(ch, 10); }
      else { board[idx(r, c)] = ch; c++; }
    }
  }
  const turn = parts[1] === 'b' ? 'b' : 'w';
  const cr = parts[2] || '-';
  const castling = { wK: cr.includes('K'), wQ: cr.includes('Q'), bK: cr.includes('k'), bQ: cr.includes('q') };
  const enPassant = parts[3] && parts[3] !== '-' ? squareToIndex(parts[3]) : null;
  const halfmove = parts[4] ? parseInt(parts[4], 10) : 0;
  const fullmove = parts[5] ? parseInt(parts[5], 10) : 1;
  return { board, turn, castling, enPassant, halfmove, fullmove };
}

// Turn a UCI string ("e2e4", "e7e8q", "e1g1") into one of the position's legal moves.
function uciToMove(s, uci) {
  if (!uci || uci.length < 4) return null;
  const from = squareToIndex(uci.slice(0, 2));
  const to = squareToIndex(uci.slice(2, 4));
  const promo = uci.length >= 5 ? uci[4].toLowerCase() : null;
  for (const m of legalMoves(s)) {
    if (m.from === from && m.to === to) {
      if (promo) { if (m.promotion === promo) return m; }
      else return m;
    }
  }
  return null;
}

function materialForColor(board, color) {
  let total = 0;
  for (const p of board) {
    if (p === '' || p.toLowerCase() === 'k') continue;
    if (colorOf(p) === color) total += PIECE_VALUE[p.toLowerCase()];
  }
  return total;
}

// Works in both the main thread (window) and a Web Worker (self).
globalThis.Chess = {
  newState, cloneState, legalMoves, legalMovesFrom, applyMove, gameStatus,
  inCheck, chooseMove, analyze, evaluate, moveToText, squareName, rc, idx,
  colorOf, isWhite, isBlack, DIFFICULTIES, FILES,
  toFEN, fromFEN, squareToIndex, uciToMove, materialForColor, PIECE_VALUE,
};
