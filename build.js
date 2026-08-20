// Assembles the static site into dist/ for deploying to Netlify (or any static host).
// No dependencies — just copies the browser files. Run with: node build.js
const fs = require('fs');
const path = require('path');

const OUT = 'dist';
const FILES = [
  'index.html', 'styles.css', 'config.js',
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

console.log(`Built ${OUT}/ — ${FILES.length} files + ${DIRS.join(', ')}`);
