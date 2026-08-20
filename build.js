// Assembles the static site into dist/ for deploying to a static host (Render or Netlify).
// No dependencies — just copies the browser files. Run with: node build.js
const fs = require('fs');
const path = require('path');

const OUT = 'dist';
const FILES = [
  'index.html', 'styles.css',
  'app.js', 'engine.js', 'sf.js', 'worker.js', 'music.js', 'puzzles.js', 'achievements.js',
];
const DIRS = ['vendor']; // the Stockfish WASM build

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('Missing file:', f); process.exit(1); }
  fs.copyFileSync(f, path.join(OUT, f));
}
for (const d of DIRS) fs.cpSync(d, path.join(OUT, d), { recursive: true });

// config.js: normally copied as-is (empty CHESSER_SERVER = same origin). But if a host
// provides CHESSER_SERVER at build time (Render's Blueprint wires it from the server
// service), bake it in so the deployed app auto-connects to the online server.
const cfgSrc = fs.readFileSync('config.js', 'utf8');
const host = (process.env.CHESSER_SERVER || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
const cfgOut = host
  ? cfgSrc.replace(/^window\.CHESSER_SERVER\s*=\s*"[^"]*";/m, `window.CHESSER_SERVER = "${host}";`)
  : cfgSrc;
fs.writeFileSync(path.join(OUT, 'config.js'), cfgOut);

console.log(`Built ${OUT}/ — ${FILES.length + 1} files + ${DIRS.join(', ')}${host ? `  (server: ${host})` : ''}`);
