export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack = (t: number, s = 1.6) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Damped spring integrated with semi-implicit Euler at the engine's fixed step.
 * Stiffness/damping are per-unit-mass. Stable for the fixed 1/120 s step used here.
 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  constructor(
    initial: number,
    public stiffness = 220,
    public damping = 22,
  ) {
    this.value = initial;
    this.target = initial;
  }
  step(dt: number) {
    const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += force * dt;
    this.value += this.velocity * dt;
  }
  impulse(v: number) {
    this.velocity += v;
  }
  snap(v: number) {
    this.value = v;
    this.target = v;
    this.velocity = 0;
  }
  get settled() {
    return Math.abs(this.value - this.target) < 0.002 && Math.abs(this.velocity) < 0.01;
  }
}

/** Seeded PRNG (mulberry32) so behaviour is reproducible in tests. */
export function createRng(seed = 0x9e3779b9) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo: number, hi: number) => lo + (hi - lo) * next(),
    chance: (p: number) => next() < p,
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    weighted: <T,>(items: readonly (readonly [T, number])[]): T => {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [item, w] of items) {
        r -= w;
        if (r <= 0) return item;
      }
      return items[items.length - 1]![0];
    },
  };
}
export type Rng = ReturnType<typeof createRng>;
