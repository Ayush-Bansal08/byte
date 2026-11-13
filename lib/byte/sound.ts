/**
 * Byte's sound effects, synthesised with the Web Audio API (no audio files).
 * Soft but clearly audible on a phone speaker; a limiter keeps every effect from getting harsh.
 * Audio can only start inside a real tap/click/key press (browser autoplay rules), and can be muted.
 */
export type Sfx = 'land' | 'jump' | 'pop' | 'blip' | 'shing' | 'chirp' | 'sparkle' | 'swoosh';

const KEY = 'byte:sound';
const MASTER = 0.9;
/** Every effect's peak is multiplied by this (the original levels were inaudible on phone speakers). */
const LEVEL = 3;

/**
 * Events that count as a user gesture somewhere. On touch screens `pointerdown` does NOT unlock audio
 * (and the first touch is usually a scroll), so we keep trying on every gesture until audio is running.
 */
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;

class ByteSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private last = new Map<Sfx, number>();
  private listeners = new Set<(on: boolean) => void>();
  private onGesture = () => this.unlock();
  muted = false;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      this.muted = localStorage.getItem(KEY) === 'off';
    } catch {
      /* storage unavailable */
    }
    for (const g of GESTURES) window.addEventListener(g, this.onGesture, { capture: true, passive: true });
  }

  /** Runs inside a user gesture: create the context once, then make sure it is actually running. */
  private unlock() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return this.stopListening();
    if (!this.ctx) {
      this.ctx = new AC();
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.12;
      limiter.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER;
      this.master.connect(limiter);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const ctx = this.ctx;
    if (ctx.state === 'running') return this.stopListening();
    // iOS/WebKit only unlocks once something is actually started inside the gesture: a 1-sample silent buffer.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    src.connect(ctx.destination);
    src.start(0);
    void ctx.resume().then(() => {
      if (ctx.state === 'running') this.stopListening();
    }, () => {});
  }

  private stopListening() {
    for (const g of GESTURES) window.removeEventListener(g, this.onGesture, { capture: true });
  }

  /** True once the browser has let audio start (for tests and the mute button). */
  get ready() {
    return this.ctx?.state === 'running';
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(KEY, m ? 'off' : 'on');
    } catch {
      /* ignore */
    }
    this.listeners.forEach((l) => l(!m));
    // Turning sound on is itself a click: answer with a chirp so the visitor knows it works.
    if (!m) {
      const c = this.ctx;
      if (c?.state === 'running') this.play('chirp');
      else void c?.resume().then(() => c.state === 'running' && this.play('chirp'), () => {});
    }
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
    if (ctx.state !== 'running') {
      void ctx.resume().catch(() => {});
      return; // scheduling into a suspended context only produces a late burst of stale sounds
    }
    const k = Math.max(0.3, Math.min(1.2, intensity));

    const tone = (type: OscillatorType, f0: number, f1: number, dur: number, peakRaw: number, delay = 0) => {
      const peak = Math.min(0.6, peakRaw * LEVEL);
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
    const hiss = (f0: number, f1: number, dur: number, peakRaw: number, q = 0.8) => {
      if (!this.noise) return;
      const peak = Math.min(0.6, peakRaw * LEVEL);
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
