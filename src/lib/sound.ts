let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function getCtx(): AudioContext | null {
  if (!ctx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

let unlocked = false;
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (!unlocked) {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
    unlocked = true;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  correct: () => { tone(660, 0, 0.14); tone(880, 0.12, 0.22); },
  wrong: () => { tone(320, 0, 0.16, 'triangle'); tone(220, 0.14, 0.28, 'triangle'); },
  tick: () => tone(1000, 0, 0.05, 'square', 0.04),
  timeout: () => tone(200, 0, 0.5, 'triangle', 0.18),
  buzz: () => tone(520, 0, 0.35, 'sawtooth', 0.1),
  finish: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22)),
  tap: () => tone(700, 0, 0.04, 'sine', 0.05),
};
