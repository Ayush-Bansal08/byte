/**
 * Byte's sound effects, synthesised with the Web Audio API (no audio files).
 * Quiet by design: every effect peaks well below full scale. Audio only starts after the
 * visitor's first click or key press (browser autoplay rules), and can be muted.
 */
export type Sfx = 'land' | 'jump' | 'pop' | 'blip' | 'shing' | 'chirp' | 'sparkle' | 'swoosh';

const KEY = 'byte:sound';
const MASTER = 0.5; // overall ceiling; individual effects are quieter still

class ByteSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private last = new Map<Sfx, number>();
  private listeners = new Set<(on: boolean) => void>();
  muted = false;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      this.muted = localStorage.getItem(KEY) === 'off';
    } catch {
      /* storage unavailable */
    }
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });
  }

  private unlock() {
    if (this.ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER;
    this.master.connect(this.ctx.destination);
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(KEY, m ? 'off' : 'on');
    } catch {
      /* ignore */
    }
    this.listeners.forEach((l) => l(!m));
  }

  subscribe(fn: (on: boolean) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  play(sfx: Sfx, intensity = 1) {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out || this.muted || document.hidden) return;
    const now = ctx.currentTime;
    const prev = this.last.get(sfx) ?? -1;
    if (now - prev < 0.09) return; // never machine-gun the same effect
    this.last.set(sfx, now);
    if (ctx.state === 'suspended') void ctx.resume();
    const k = Math.max(0.3, Math.min(1.2, intensity));

    const tone = (type: OscillatorType, f0: number, f1: number, dur: number, peak: number, delay = 0) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, now + delay);
      o.frequency.exponentialRampToValueAtTime(f1, now + delay + dur);
      g.gain.setValueAtTime(0.0001, now + delay);
      g.gain.exponentialRampToValueAtTime(peak, now + delay + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      o.connect(g).connect(out);
      o.start(now + delay);
      o.stop(now + delay + dur + 0.02);
    };
    const hiss = (f0: number, f1: number, dur: number, peak: number, q = 0.8) => {
      if (!this.noise) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = q;
      bp.frequency.setValueAtTime(f0, now);
      bp.frequency.exponentialRampToValueAtTime(f1, now + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak, now + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(bp).connect(g).connect(out);
      src.start(now);
      src.stop(now + dur + 0.02);
    };

    switch (sfx) {
      case 'land': // soft rubbery boop
        tone('sine', 360 + 60 * k, 140, 0.13, 0.09 * k);
        tone('triangle', 720, 300, 0.05, 0.025 * k);
        break;
      case 'jump': // airy upward whoosh
        hiss(500, 2200, 0.16, 0.03 * k, 1.2);
        tone('sine', 300, 620, 0.12, 0.03 * k);
        break;
      case 'pop': // costume change
        tone('triangle', 900, 1500, 0.07, 0.05);
        tone('sine', 1500, 2200, 0.05, 0.025, 0.05);
        break;
      case 'blip': // speech bubble
        tone('sine', 820, 980, 0.06, 0.028);
        break;
      case 'shing': // sword drawn
        tone('triangle', 1800, 2900, 0.11, 0.022);
        hiss(5000, 8000, 0.12, 0.012, 2);
        break;
      case 'chirp': // waking up
        tone('sine', 500, 1100, 0.09, 0.04);
        tone('sine', 700, 1400, 0.08, 0.03, 0.09);
        break;
      case 'sparkle': // celebrate
        [1047, 1319, 1568].forEach((f, i) => tone('sine', f, f * 1.01, 0.12, 0.03, i * 0.07));
        break;
      case 'swoosh': // the curtain
        hiss(300, 1600, 0.42, 0.035, 0.7);
        break;
    }
  }
}

let instance: ByteSound | null = null;
export function sound(): ByteSound {
  instance ??= new ByteSound();
  return instance;
}
