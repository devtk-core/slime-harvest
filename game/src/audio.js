// All sound is synthesised with WebAudio: no audio files, nothing to load.
// The context is created lazily on the first user gesture, as browsers ask.

let ctx = null;
let bgmTimer = null;
let bgmStep = 0;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
}

function tone(freqFrom, freqTo, seconds, type, gain, when = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

export function playDrop() {
  tone(320, 170, 0.09, 'sine', 0.16);
}

export function playMerge(stage) {
  const base = 360 + stage * 55;
  tone(base, base * 1.5, 0.13, 'triangle', 0.22);
  tone(base * 2, base * 2.2, 0.08, 'sine', 0.1, 0.02);
}

export function playHarvest() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => tone(n, n, 0.16, 'triangle', 0.2, i * 0.07));
}

export function playRoyal() {
  const notes = [392, 523, 659, 784, 1047, 1319];
  notes.forEach((n, i) => tone(n, n, 0.22, 'triangle', 0.22, i * 0.09));
}

export function playGameOver() {
  const notes = [392, 330, 262, 196];
  notes.forEach((n, i) => tone(n, n * 0.94, 0.25, 'sawtooth', 0.08, i * 0.16));
}

export function playWin() {
  const notes = [523, 659, 784, 1047, 784, 1047];
  notes.forEach((n, i) => tone(n, n, 0.2, 'triangle', 0.2, i * 0.11));
}

export function playClick() {
  tone(700, 660, 0.05, 'square', 0.06);
}

// A gentle pentatonic loop while a run is on. Quiet on purpose.
const BGM_NOTES = [262, 294, 330, 392, 330, 294, 262, 220, 262, 294, 330, 392, 440, 392, 330, 294];

export function startBgm() {
  if (!ctx || bgmTimer) return;
  bgmTimer = window.setInterval(() => {
    if (!ctx) return;
    const note = BGM_NOTES[bgmStep % BGM_NOTES.length];
    bgmStep += 1;
    tone(note, note, 0.34, 'sine', 0.045);
    if (bgmStep % 4 === 0) tone(note / 2, note / 2, 0.4, 'sine', 0.03);
  }, 300);
}

export function stopBgm() {
  if (bgmTimer) {
    window.clearInterval(bgmTimer);
    bgmTimer = null;
  }
}
