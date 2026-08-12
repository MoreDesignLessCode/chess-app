// Background music + a little piano for Chesser — all made in code with the
// Web Audio API. No sound files to download: we build every note from beeps.
//  • 6 background tunes (a Bronze perk — pick your favorite).
//  • A playable piano (a Silver perk — tap the tiles to play notes yourself).
(function () {
  let ctx = null;      // the Web Audio "studio" — made only when sound first plays
  let master = null;   // main volume knob for the background music
  let timer = null;    // schedules the next batch of notes
  let playing = false;
  let step = 0;        // which note of the tune we're on
  let track = 0;       // which of the 6 tunes is chosen

  // Turn a note name like "C4" into its frequency in hertz (its pitch).
  function freq(note) {
    if (!note) return 0;
    const names = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const m = note.match(/^([A-G])(#?)(\d)$/);
    if (!m) return 0;
    let semis = names[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3], 10) - 4) * 12;
    return 261.63 * Math.pow(2, semis / 12); // 261.63 Hz = middle C (C4)
  }

  // The 6 tunes. Each has a name, a wave "shape", speed, a melody, and a bass line.
  // null in a melody means a rest (a moment of silence).
  // Each track is deliberately different: its own tempo (step), sound (wave),
  // note length (gap: short = bouncy, long = smooth), how often the bass thumps
  // (bassEvery), the bass sound, and its own note range. So they don't feel samey.
  // The BIG trick to sounding different: each tune lives in its own KEY/SCALE, so
  // it uses a totally different set of notes. Plus its own tempo, sound and rhythm.
  const TRACKS = [
    // 1) Calm Castle — C major, slow rocking arpeggios (a soft lullaby).
    { name: 'Calm Castle', icon: '\u{1F3F0}', wave: 'triangle', step: 0.34, gap: 0.98,
      leadVol: 0.14, bassEvery: 3, bassWave: 'sine', bassVol: 0.13,
      mel: ['C4','E4','G4','E4','C5','G4','E4','C4','F4','A4','C5','A4','G4','B4','D5','G4'],
      bass: ['C3','G2','A2','F2'] },
    // 2) Happy Hop — G major PENTATONIC (only G A B D E), a bouncy folk jig.
    { name: 'Happy Hop', icon: '\u{1F407}', wave: 'square', step: 0.15, gap: 0.45,
      leadVol: 0.12, bassEvery: 2, bassWave: 'square', bassVol: 0.10,
      mel: ['G4','B4','D5','B4','G4','A4','B4','A4','G4','E4','D4','E4','G4','A4','B4',null],
      bass: ['G2','D3','E3','C3'] },
    // 3) Night Sky — D minor, slow dreamy leaps over a deep drone.
    { name: 'Night Sky', icon: '\u{1F319}', wave: 'sine', step: 0.44, gap: 0.9,
      leadVol: 0.13, bassEvery: 8, bassWave: 'sine', bassVol: 0.11,
      mel: ['D4',null,'A4',null,'F4',null,'D5',null,'C5',null,'A#4',null,'A4',null,'F4',null],
      bass: ['D2','A2'] },
    // 4) Robot March — E minor with a menacing tritone, buzzy driving eighths.
    { name: 'Robot March', icon: '\u{1F916}', wave: 'sawtooth', step: 0.17, gap: 0.55,
      leadVol: 0.12, bassEvery: 2, bassWave: 'square', bassVol: 0.13,
      mel: ['E3','E3','A#3','E3','E3','G3','E3','A#3','E4','D4','B3','G3','F#3','G3','E3',null],
      bass: ['E2','E2','G2','D2'] },
    // 5) Sunny Day — D major (with bright F# & C#), a hummable happy theme.
    { name: 'Sunny Day', icon: '☀️', wave: 'triangle', step: 0.20, gap: 0.85,
      leadVol: 0.14, bassEvery: 4, bassWave: 'triangle', bassVol: 0.12,
      mel: ['D4','F#4','A4','D5','C#5','A4','F#4','A4','G4','B4','A4','G4','F#4','E4','D4',null],
      bass: ['D3','G3','A3','D3'] },
    // 6) Spooky Fun — A harmonic minor (that eerie G#→F step), creepy and slow.
    { name: 'Spooky Fun', icon: '\u{1F47B}', wave: 'square', step: 0.30, gap: 0.8,
      leadVol: 0.12, bassEvery: 4, bassWave: 'sawtooth', bassVol: 0.12,
      mel: ['A3','C4','E4','A4','G#4','E4','C4','A3','F4','D#4','B3','G#3','A3',null],
      bass: ['A2','A2','F2','E2'] },
  ];

  // Play one note: start a tone, fade it in, then fade it out (an "envelope").
  function tone(f, start, dur, type, vol, out) {
    if (!f) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(out || master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  // Schedule the next handful of tune notes, a little ahead of real time.
  function schedule() {
    if (!playing) return;
    const t = TRACKS[track];
    const now = ctx.currentTime;
    const BATCH = 8;
    const gap = t.gap != null ? t.gap : 0.9;          // note length (smooth vs staccato)
    const leadVol = t.leadVol != null ? t.leadVol : 0.15;
    const bassEvery = t.bassEvery || 4;                // how often the bass thumps
    const bassWave = t.bassWave || 'sine';
    const bassVol = t.bassVol != null ? t.bassVol : 0.12;
    for (let i = 0; i < BATCH; i++) {
      const when = now + i * t.step;
      const idx = (step + i) % t.mel.length;
      tone(freq(t.mel[idx]), when, t.step * gap, t.wave, leadVol);
      if (t.bass && t.bass.length && idx % bassEvery === 0) {
        tone(freq(t.bass[(idx / bassEvery) % t.bass.length]), when, t.step * bassEvery * 0.95, bassWave, bassVol);
      }
    }
    step = (step + BATCH) % (t.mel.length * 100);
    timer = setTimeout(schedule, BATCH * t.step * 1000);
  }

  // Make the audio studio (browsers require a user click before any sound).
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function start() {
    if (playing) return;
    if (!ensureCtx()) return;
    playing = true;
    step = 0;
    schedule();
  }

  function stop() {
    playing = false;
    if (timer) { clearTimeout(timer); timer = null; }
    if (ctx && ctx.state === 'running' && !pianoUsedRecently()) ctx.suspend();
  }

  // Switch which tune plays; if music is on, restart it with the new tune.
  function setTrack(i) {
    track = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    if (playing) { step = 0; }
  }

  // --- Piano: play a single note when you tap a tile ---
  let lastPiano = 0;
  function pianoUsedRecently() { return false; } // (kept simple; suspend is fine)
  function playKey(note) {
    if (!ensureCtx()) return;
    const start = ctx.currentTime;
    // A warmer "piano-ish" sound = two waves stacked, with a quick pluck fade.
    tone(freq(note), start, 0.9, 'triangle', 0.22);
    const up = note.replace(/(\d)$/, (d) => String(+d)); // same note
    tone(freq(note) * 2, start, 0.5, 'sine', 0.08);      // a soft higher shimmer
  }

  window.ChesserMusic = {
    isOn: () => playing,
    toggle() { playing ? stop() : start(); return playing; },
    start, stop,
    tracks: () => TRACKS.map((t) => ({ name: t.name, icon: t.icon })),
    currentTrack: () => track,
    setTrack,
    playKey,
  };
})();
