// Real-time online chess server for Chesser.
// Serves the app's files AND a WebSocket that matches two players and relays
// their moves. Run with: node online-server.js  (or npm run online)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 4180;
const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

let payments = 0; // demo payment counter (no real money — that needs Stripe etc.)

// --- HTTP server: serves the app AND a small JSON API (health + demo payment) ---
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // JSON API — like the online play, the client talks to this server over the network.
  if (urlPath.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (urlPath === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, online, payments }));
      return;
    }
    if (urlPath === '/api/pay' && req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 1e4) req.destroy(); });
      req.on('end', () => {
        let d = {}; try { d = JSON.parse(body); } catch (e) {}
        payments++;
        console.log(`Demo payment: ${d.plan} for ${d.user || 'guest'} (total ${payments})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        // A real charge would call a payment provider here. This is a demo confirm.
        res.end(JSON.stringify({ ok: true, plan: d.plan, confirmedBy: 'server', demo: true }));
      });
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{}');
    return;
  }

  // Otherwise serve static files.
  let p = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.normalize(path.join(ROOT, p));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    // Don't cache the app code so edits always show up (big .wasm can still cache).
    if (['.html', '.js', '.css'].includes(ext)) headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    res.writeHead(200, headers);
    res.end(data);
  });
});

// --- WebSocket matchmaking + relay ---
const wss = new WebSocketServer({ server });
let waiting = null;          // one player waiting for a game opponent
let paired = 0, online = 0;
const worldRoom = new Set(); // everyone currently in the World chat room

function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function broadcastWorld(obj, except) { for (const c of worldRoom) if (c !== except) send(c, obj); }

wss.on('connection', (ws) => {
  online++;
  ws.opponent = null;
  ws.color = null;

  ws.on('message', (data) => {
    let msg; try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'find') {
      ws.name = (msg.name || 'Guest').slice(0, 20);
      if (waiting && waiting !== ws && waiting.readyState === 1) {
        const opp = waiting; waiting = null;
        ws.opponent = opp; opp.opponent = ws;
        // Randomly assign colors.
        const whiteIsNew = Math.random() < 0.5;
        ws.color = whiteIsNew ? 'w' : 'b';
        opp.color = whiteIsNew ? 'b' : 'w';
        paired++;
        console.log(`Paired ${ws.name} vs ${opp.name} (game #${paired})`);
        send(ws, { type: 'start', color: ws.color, opponent: opp.name });
        send(opp, { type: 'start', color: opp.color, opponent: ws.name });
      } else {
        waiting = ws;
        send(ws, { type: 'waiting' });
      }
    } else if (msg.type === 'joinWorld') {
      // World chat is one shared room — everyone online talks together, no pairing.
      ws.name = (msg.name || 'Guest').slice(0, 20);
      ws.inWorld = true;
      worldRoom.add(ws);
      send(ws, { type: 'worldJoined', count: worldRoom.size });
      broadcastWorld({ type: 'worldSys', text: `${ws.name} joined` }, ws);
    } else if (msg.type === 'leaveWorld') {
      if (worldRoom.delete(ws)) broadcastWorld({ type: 'worldSys', text: `${ws.name} left` });
      ws.inWorld = false;
    } else if (msg.type === 'worldMsg') {
      // Send this player's message to everyone else in the room (they echo their own locally).
      if (worldRoom.has(ws)) broadcastWorld({ type: 'worldMsg', name: ws.name, text: String(msg.text || '').slice(0, 200) }, ws);
    } else if (msg.type === 'move') {
      if (ws.opponent) send(ws.opponent, { type: 'opponentMove', uci: msg.uci });
    } else if (msg.type === 'chat') {
      // Relay a quick-chat message to the opponent (capped length; presets only client-side).
      if (ws.opponent) send(ws.opponent, { type: 'chat', text: String(msg.text || '').slice(0, 60) });
    } else if (msg.type === 'resign') {
      if (ws.opponent) send(ws.opponent, { type: 'opponentResign' });
    } else if (msg.type === 'cancel') {
      if (waiting === ws) waiting = null;
    }
  });

  ws.on('close', () => {
    online--;
    if (waiting === ws) waiting = null;
    if (worldRoom.delete(ws)) broadcastWorld({ type: 'worldSys', text: `${ws.name || 'Someone'} left` });
    if (ws.opponent) {
      send(ws.opponent, { type: 'opponentLeft' });
      ws.opponent.opponent = null;
      ws.opponent = null;
    }
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Chesser running at ${url}  (app + online + payments, all on one server)`);
  console.log('Open it in two windows to play a live game. Ctrl+C to stop.');
  // Open a browser automatically (like the old start script). Skip with CHESSUP_NO_BROWSER.
  if (!process.env.CHESSUP_NO_BROWSER) {
    const opener = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${opener} ${url}`, () => {});
  }
});
