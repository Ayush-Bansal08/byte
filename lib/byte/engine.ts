import { ByteMachine, type ByteState } from './machine';
import { Spring, clamp, createRng, easeInOutCubic, easeOutBack, type Rng } from './math';

export type Vec = { x: number; y: number };
export type Expression = 'neutral' | 'happy' | 'surprised' | 'sleepy' | 'focused' | 'wince' | 'closed' | 'sad' | 'star' | 'heart' | 'wink';
/** Resting moods a section can give Byte. */
export const MOODS = ['neutral', 'happy', 'star', 'heart', 'wink', 'focused', 'surprised'] as const;
export type Mood = (typeof MOODS)[number];
export type Mouth = 'none' | 'smile' | 'o' | 'flat' | 'talk' | 'dots' | 'grin';
export type ArmMode = 'rest' | 'wave' | 'point' | 'up' | 'think' | 'pull' | 'out' | 'hold';
export const COSTUMES = ['none', 'agent', 'helmet', 'glasses', 'trophy', 'party', 'cap', 'headset', 'crown', 'detective', 'medic', 'beanie'] as const;
export type Costume = (typeof COSTUMES)[number];
/** Hand-held props. Byte picks one at random, so pointing never looks the same twice. */
export const TOOLS = ['sword', 'wand', 'pointer', 'flag', 'magnifier', 'wrench', 'mug'] as const;
export type Tool = (typeof TOOLS)[number];
export const POINT_TOOLS: readonly Tool[] = ['sword', 'wand', 'pointer', 'flag'];
export const INSPECT_TOOLS: readonly Tool[] = ['magnifier', 'wrench', 'sword', 'wand'];

export type EngineConfig = {
  /** px per rig unit (body is 30 × 36 units) */
  scale: number;
  gravity: number; // px/s²
  walkSpeed: number; // px/s
  walkAccel: number; // px/s²
  stride: number; // px travelled per half walk-cycle
  jumpApex: number; // px above the higher of start/end
};

export const DEFAULT_CONFIG: EngineConfig = {
  scale: 1.15,
  gravity: 2600,
  walkSpeed: 150,
  walkAccel: 700,
  stride: 15,
  jumpApex: 70,
};

export const FIXED_DT = 1 / 120;

export interface Action {
  name: string;
  state: ByteState;
  /** false while airborne etc. A non-interruptible action finishes before a replacement starts. */
  interruptible?: boolean;
  start?(e: ByteEngine): void;
  update(e: ByteEngine, dt: number, t: number): boolean;
  end?(e: ByteEngine, cancelled: boolean): void;
}

export type EngineEvent =
  | { type: 'state'; state: ByteState; prev: ByteState }
  | { type: 'action'; name: string; phase: 'start' | 'end' | 'rejected' }
  | { type: 'landed'; x: number; y: number }
  | { type: 'apex' };

export class ByteEngine {
  readonly machine: ByteMachine;
  cfg: EngineConfig;
  rng: Rng;
  time = 0;

  // ----- body physics (world px, feet position) -----
  x = 0;
  y = 0;
  prevX = 0;
  prevY = 0;
  vx = 0;
  vy = 0;
  grounded = true;
  facing: 1 | -1 = 1;

  // ----- animated channels -----
  face = new Spring(1, 320, 30);
  squash = new Spring(1, 560, 11);
  lean = new Spring(0, 170, 17);
  crouch = new Spring(0, 300, 26);
  sit = new Spring(0, 40, 12);
  eyeX = new Spring(0, 280, 26);
  eyeY = new Spring(0, 280, 26);
  lid = new Spring(1, 900, 50);
  armF = new Spring(0.3, 210, 17);
  armB = new Spring(0.3, 210, 17);
  elbowF = new Spring(0.4, 210, 18);
  elbowB = new Spring(0.4, 210, 18);
  tuck = new Spring(0, 260, 24);
  size = new Spring(1, 260, 20);
  legExtend = new Spring(1, 300, 22);
  opacity = new Spring(1, 200, 28);
  walkPhase = 0;
  walkAmp = 0;
  dangle = new Spring(0, 60, 4);

  expression: Expression = 'neutral';
  /** expression Byte relaxes back to when idle (set per section) */
  restMood: Mood = 'neutral';
  /** whole-body spin in degrees (front flip on costume change) */
  spin = 0;
  mouth: Mouth = 'smile';
  armModeF: ArmMode = 'rest';
  armModeB: ArmMode = 'rest';
  costume: Costume = 'none';
  /** The eyes follow this when set (world coords), otherwise the pointer, otherwise idle saccades. */
  lookAt: Vec | null = null;
  pointer: Vec | null = null;
  pointerFreshUntil = 0;
  saccade: Vec = { x: 0, y: 0 };
  nextSaccade = 0;
  props: { zzz: boolean; think: boolean; confettiAt: number; sparkleAt: number; tool: Tool | null } = {
    zzz: false,
    think: false,
    confettiAt: -10,
    sparkleAt: -10,
    tool: null,
  };
  /** arm angle (radians from straight down, forward positive) used by the 'point' arm mode */
  pointAngle = 1.62;
  talkUntil = 0;

  private blinkAt = 2;
  private blinkEnd = -1;
  private doubleBlink = false;

  private queue: Action[] = [];
  current: Action | null = null;
  private actionT = 0;
  private listeners = new Set<(ev: EngineEvent) => void>();
  rejected = 0;

  constructor(cfg: Partial<EngineConfig> = {}, seed = 1) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
    this.rng = createRng(seed);
    this.machine = new ByteMachine(() => this.time);
    this.machine.subscribe((state, prev) => this.emit({ type: 'state', state, prev }));
    this.blinkAt = this.rng.range(1.2, 3);
  }

  get state(): ByteState {
    return this.machine.state;
  }

  on(fn: (ev: EngineEvent) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(ev: EngineEvent) {
    this.listeners.forEach((l) => l(ev));
  }

  place(x: number, y: number) {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.vx = this.vy = 0;
    this.grounded = true;
  }

  /** Replace the plan. A non-interruptible current action (e.g. mid-air) completes first. */
  run(actions: Action[], opts: { append?: boolean } = {}) {
    if (opts.append) {
      this.queue.push(...actions);
      return;
    }
    this.queue = [...actions];
    if (this.current && this.current.interruptible !== false) {
      this.finishCurrent(true);
    }
  }

  get busy() {
    return this.current !== null || this.queue.length > 0;
  }
  get actionName() {
    return this.current?.name ?? null;
  }

  clear() {
    this.queue = [];
    if (this.current) this.finishCurrent(true);
  }

  private finishCurrent(cancelled: boolean) {
    const a = this.current;
    if (!a) return;
    this.current = null;
    a.end?.(this, cancelled);
    this.emit({ type: 'action', name: a.name, phase: 'end' });
  }

  /** Called by actions for sub-phases (e.g. JUMPING → LANDING). */
  enter(state: ByteState, reason = '') {
    return this.machine.to(state, reason);
  }

  setPointer(p: Vec | null, freshFor = 2.5) {
    this.pointer = p;
    if (p) this.pointerFreshUntil = this.time + freshFor;
  }

  say(seconds: number) {
    this.talkUntil = this.time + seconds;
  }

  // ------------------------------------------------------------------ step
  step(dt: number) {
    this.time += dt;
    this.prevX = this.x;
    this.prevY = this.y;

    if (!this.current) this.startNext();
    if (this.current) {
      this.actionT += dt;
      const done = this.current.update(this, dt, this.actionT);
      if (done) {
        this.finishCurrent(false);
        this.startNext();
      }
    }

    this.updateWalkCycle(dt);
    this.updateEyes(dt);
    this.updateBlink();
    this.updateArms();

    for (const s of [
      this.face,
      this.squash,
      this.lean,
      this.crouch,
      this.sit,
      this.eyeX,
      this.eyeY,
      this.lid,
      this.armF,
      this.armB,
      this.elbowF,
      this.elbowB,
      this.tuck,
      this.size,
      this.legExtend,
      this.opacity,
      this.dangle,
    ])
      s.step(dt);
  }

  private startNext() {
    while (!this.current && this.queue.length) {
      const next = this.queue.shift()!;
      if (!this.machine.to(next.state, next.name)) {
        this.rejected++;
        this.emit({ type: 'action', name: next.name, phase: 'rejected' });
        continue;
      }
      this.current = next;
      this.actionT = 0;
      next.start?.(this);
      this.emit({ type: 'action', name: next.name, phase: 'start' });
    }
    if (!this.current && !this.queue.length) this.settleIdle();
  }

  /** With nothing scheduled, fall back to IDLE when that is a legal move. */
  private settleIdle() {
    const s = this.machine.state;
    if (s === 'HIDDEN' || s === 'SLEEPING' || s === 'DROWSY' || s === 'IDLE' || s === 'TRANSITIONING' || s === 'DRAGGED') return;
    if (s === 'LANDING') this.machine.to('RECOVERING', 'settle');
    this.machine.to('IDLE', 'settle');
    this.armModeF = this.armModeF === 'hold' ? 'hold' : 'rest';
    this.armModeB = 'rest';
    this.props.think = false;
    // expressions relax back to the section's resting mood once nothing is happening
    if (this.expression !== this.restMood && this.expression !== 'sleepy' && this.expression !== 'closed') this.expression = this.restMood;
    if (this.mouth !== 'smile') this.mouth = 'smile';
  }

  private updateWalkCycle(dt: number) {
    const speed = Math.abs(this.vx);
    const targetAmp = this.grounded ? clamp(speed / this.cfg.walkSpeed, 0, 1.25) : 0;
    this.walkAmp += (targetAmp - this.walkAmp) * Math.min(1, dt * 12);
    if (this.grounded && speed > 1) {
      const before = Math.floor(this.walkPhase / Math.PI);
      this.walkPhase += (speed * dt * Math.PI) / this.cfg.stride;
      // each footfall: a little squash, so the gait bounces instead of gliding
      if (Math.floor(this.walkPhase / Math.PI) !== before) this.squash.impulse(-1.1 * clamp(this.walkAmp, 0.3, 1));
    }
    else if (this.walkAmp < 0.05) {
      // settle the cycle to the nearest neutral pose so feet come together naturally
      const target = Math.round((this.walkPhase - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2;
      this.walkPhase += (target - this.walkPhase) * Math.min(1, dt * 6);
    }
  }

  private updateEyes(dt: number) {
    const s = this.cfg.scale * this.size.value;
    const eye = { x: this.x, y: this.y - 36 * s };
    let target: Vec | null = this.lookAt;
    if (!target && this.pointer && this.time < this.pointerFreshUntil) target = this.pointer;
    let ex: number;
    let ey: number;
    if (target) {
      const dx = target.x - eye.x;
      const dy = target.y - eye.y;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.tanh(d / 260);
      ex = (dx / d) * k * 2.6;
      ey = (dy / d) * k * 1.8;
    } else {
      if (this.time > this.nextSaccade) {
        const st = this.machine.state;
        const calm = st === 'SLEEPING' || st === 'DROWSY';
        this.saccade = calm ? { x: 0, y: 0.6 } : { x: this.rng.range(-2.2, 2.2), y: this.rng.range(-1.2, 1.2) };
        this.nextSaccade = this.time + this.rng.range(0.7, 2.6);
      }
      ex = this.saccade.x;
      ey = this.saccade.y;
    }
    this.eyeX.target = ex;
    this.eyeY.target = ey;
    void dt;
  }

  private updateBlink() {
    const st = this.machine.state;
    if (st === 'SLEEPING' || this.expression === 'closed') {
      this.lid.target = 0;
      return;
    }
    const base = st === 'DROWSY' || this.expression === 'sleepy' ? 0.35 : this.expression === 'focused' ? 0.7 : 1;
    if (this.time >= this.blinkAt && this.blinkEnd < 0) {
      this.blinkEnd = this.time + 0.09;
    }
    if (this.blinkEnd > 0) {
      this.lid.target = 0;
      if (this.time >= this.blinkEnd) {
        this.blinkEnd = -1;
        this.lid.target = base;
        if (!this.doubleBlink && this.rng.chance(0.18)) {
          this.doubleBlink = true;
          this.blinkAt = this.time + 0.16;
        } else {
          this.doubleBlink = false;
          this.blinkAt = this.time + (st === 'DROWSY' ? this.rng.range(1.0, 2.2) : this.rng.range(2.2, 6.2));
        }
      }
    } else this.lid.target = base;
  }

  blinkNow() {
    this.blinkAt = this.time;
  }

  private updateArms() {
    const t = this.time;
    const sp = clamp(this.walkAmp, 0, 1);
    const swing = Math.sin(this.walkPhase) * 0.45 * sp;
    const breath = Math.sin(t * 2) * 0.03;
    const airborne = !this.grounded;
    const setArm = (arm: Spring, elbow: Spring, mode: ArmMode, sign: 1 | -1) => {
      switch (mode) {
        case 'wave':
          arm.target = 2.55 + Math.sin(t * 15) * 0.32;
          elbow.target = 0.5 + Math.sin(t * 15 + 0.8) * 0.35;
          return;
        case 'point':
          arm.target = this.pointAngle + Math.sin(t * 3) * 0.04;
          elbow.target = 0.04;
          return;
        case 'up':
          arm.target = 2.75 + Math.sin(t * 9 + (sign > 0 ? 0 : 1.6)) * 0.15;
          elbow.target = 0.25;
          return;
        case 'think':
          arm.target = 1.05;
          elbow.target = 2.15;
          return;
        case 'pull':
          arm.target = -1.25 + Math.sin(t * 18) * 0.05;
          elbow.target = 0.15;
          return;
        case 'out':
          arm.target = 1.35 + Math.sin(t * 7 + sign) * 0.12;
          elbow.target = 0.2;
          return;
        case 'hold':
          arm.target = 0.95;
          elbow.target = 1.2;
          return;
        default:
          if (airborne) {
            arm.target = this.vy < 0 ? 2.3 : 1.25 + Math.sin(t * 22 + sign) * 0.1;
            elbow.target = 0.3;
          } else {
            arm.target = 0.28 + sign * swing + breath + this.crouch.value * 0.4;
            elbow.target = 0.35 + Math.abs(swing) * 0.6;
          }
      }
    };
    setArm(this.armF, this.elbowF, this.armModeF, 1);
    setArm(this.armB, this.elbowB, this.armModeB, -1);
  }
}

// =================================================================== Actions

export function wait(seconds: number, state: ByteState = 'IDLE'): Action {
  return { name: `wait:${seconds.toFixed(2)}`, state, update: (_e, _dt, t) => t >= seconds };
}

export function turn(dir: 1 | -1): Action {
  return {
    name: `turn:${dir}`,
    state: 'TURNING',
    start(e) {
      e.facing = dir;
      e.face.target = dir;
      e.eyeX.velocity += dir * 30; // eyes lead the turn
      e.squash.impulse(-0.6);
    },
    update: (_e, _dt, t) => t >= 0.2,
  };
}

/** Walk to x with accel-limited arrival steering; legs are driven by distance, so feet never slide. */
export function walkTo(targetX: number, opts: { speed?: number } = {}): Action {
  return {
    name: `walk:${Math.round(targetX)}`,
    state: 'WALKING',
    start(e) {
      const dir: 1 | -1 = targetX >= e.x ? 1 : -1;
      if (dir !== e.facing) {
        e.facing = dir;
        e.face.target = dir;
      }
      e.expression = e.expression === 'sleepy' ? 'neutral' : e.expression;
    },
    update(e, dt) {
      const max = opts.speed ?? e.cfg.walkSpeed;
      const dx = targetX - e.x;
      const dist = Math.abs(dx);
      const dir = Math.sign(dx) || 1;
      const desired = dir * Math.min(max, Math.sqrt(2 * e.cfg.walkAccel * 0.85 * dist));
      const dv = clamp(desired - e.vx, -e.cfg.walkAccel * dt, e.cfg.walkAccel * dt);
      e.vx += dv;
      e.x += e.vx * dt;
      e.lean.target = clamp(e.vx / max, -1, 1) * 7 + (dv / dt / e.cfg.walkAccel) * 3;
      if (dist < 0.6 && Math.abs(e.vx) < 12) {
        e.x = targetX;
        e.vx = 0;
        e.lean.target = 0;
        return true;
      }
      return false;
    },
    end(e) {
      e.vx = 0;
      e.lean.target = 0;
    },
  };
}

export type JumpOpts = {
  apex?: number;
  anticipation?: number;
  costumeAtApex?: Costume;
  /** start from current position even if airborne (used for drag release and drop-ins) */
  noAnticipation?: boolean;
  exitHidden?: boolean;
};

/**
 * Anticipation (squash) → analytic ballistic flight that lands exactly on target →
 * landing compression → recovery. Arrival is exact regardless of frame rate.
 */
export function jumpTo(tx: number, ty: number, opts: JumpOpts = {}): Action {
  let phase: 'crouch' | 'air' | 'land' = 'crouch';
  let t0 = 0;
  let x0 = 0;
  let y0 = 0;
  let vx0 = 0;
  let vy0 = 0;
  let T = 0;
  let apexFired = false;
  const anticipation = opts.noAnticipation ? 0 : (opts.anticipation ?? 0.12);
  const launch = (e: ByteEngine, t: number) => {
    phase = 'air';
    t0 = t;
    x0 = e.x;
    y0 = e.y;
    const g = e.cfg.gravity;
    const apexY = Math.min(y0, ty) - (opts.apex ?? e.cfg.jumpApex);
    const up = Math.max(0, y0 - apexY);
    vy0 = -Math.sqrt(2 * g * up);
    const tUp = -vy0 / g;
    const tDown = Math.sqrt((2 * Math.max(0, ty - apexY)) / g);
    T = Math.max(0.12, tUp + tDown);
    vx0 = (tx - x0) / T;
    e.grounded = false;
    e.crouch.target = 0;
    e.squash.impulse(5.5);
    e.tuck.target = 1;
    const dir: 1 | -1 = tx >= x0 ? 1 : -1;
    if (Math.abs(tx - x0) > 4 && dir !== e.facing) {
      e.facing = dir;
      e.face.target = dir;
    }
  };
  return {
    name: `jump:${Math.round(tx)},${Math.round(ty)}`,
    state: 'JUMPING',
    interruptible: false,
    start(e) {
      e.lookAt = { x: tx, y: ty - 20 };
      e.expression = 'focused';
      if (anticipation === 0) launch(e, 0);
      else {
        e.crouch.target = 1;
        e.squash.target = 0.78;
      }
    },
    update(e, _dt, t) {
      if (phase === 'crouch') {
        if (t >= anticipation) {
          e.squash.target = 1;
          launch(e, t);
        }
        return false;
      }
      if (phase === 'air') {
        const tt = Math.min(t - t0, T);
        const g = e.cfg.gravity;
        e.x = x0 + vx0 * tt;
        e.y = y0 + vy0 * tt + 0.5 * g * tt * tt;
        e.vx = vx0;
        e.vy = vy0 + g * tt;
        e.squash.target = 1 + clamp(Math.abs(e.vy) / 2600, 0, 0.2);
        e.lean.target = clamp(vx0 / 40, -10, 10);
        if (opts.costumeAtApex && T > 0.3) {
          // a front flip: the outfit swaps at the top of the spin
          const k = clamp(tt / T, 0, 1);
          e.spin = 360 * (k * k * (3 - 2 * k)) * (vx0 >= 0 ? 1 : -1);
          e.tuck.target = 1;
        }
        if (!apexFired && e.vy >= 0) {
          apexFired = true;
          e.emit({ type: 'apex' });
          if (opts.costumeAtApex) {
            e.costume = opts.costumeAtApex;
            e.props.sparkleAt = e.time;
          }
          e.lookAt = { x: tx, y: ty };
          e.tuck.target = 0.35;
        }
        if (tt >= T) {
          e.x = tx;
          e.y = ty;
          e.grounded = true;
          e.spin = 0;
          e.vx = 0;
          const impact = e.vy;
          e.vy = 0;
          e.tuck.target = 0;
          e.lean.target = 0;
          if (opts.exitHidden) return true;
          phase = 'land';
          t0 = t;
          e.squash.target = 1;
          e.squash.impulse(-clamp(impact / 220, 3, 9));
          e.crouch.snap(0);
          e.crouch.impulse(clamp(impact / 120, 4, 14));
          e.enter('LANDING', 'touchdown');
          e.emit({ type: 'landed', x: tx, y: ty });
        }
        return false;
      }
      // landing → recovery
      if (t - t0 > 0.08 && e.state === 'LANDING') {
        e.enter('RECOVERING', 'recover');
        e.expression = 'neutral';
        e.lookAt = null;
      }
      return t - t0 > 0.16;
    },
    end(e) {
      e.grounded = true;
      e.spin = 0;
      e.tuck.target = 0;
      e.crouch.target = 0;
      e.squash.target = 1;
      if (e.expression === 'focused') e.expression = 'neutral';
      e.lookAt = null;
      if (opts.exitHidden) e.machine.to('HIDDEN', 'exited');
    },
  };
}

export function wave(seconds = 1.4): Action {
  return {
    name: 'wave',
    state: 'WAVING',
    start(e) {
      e.armModeF = 'wave';
      e.expression = 'happy';
      if (e.time >= e.talkUntil) e.mouth = 'grin';
    },
    update: (_e, _dt, t) => t >= seconds,
    end(e) {
      e.armModeF = 'rest';
      if (e.time >= e.talkUntil) e.mouth = 'smile';
    },
  };
}

/** Aim the front arm (and sword) at a world point, from roughly shoulder height. */
function aimAt(e: ByteEngine, target: Vec) {
  const s = e.cfg.scale * e.size.value;
  const dx = Math.abs(target.x - e.x);
  const dy = target.y - (e.y - 33 * s);
  e.pointAngle = clamp(Math.atan2(dx, dy), 0.55, 2.7);
}

export function point(target: Vec, seconds = 1.6): Action {
  return {
    name: 'point',
    state: 'POINTING',
    start(e) {
      const dir: 1 | -1 = target.x >= e.x ? 1 : -1;
      e.facing = dir;
      e.face.target = dir;
      e.armModeF = 'point';
      aimAt(e, target);
      e.props.tool = e.rng.pick(e.state === 'INSPECTING' ? INSPECT_TOOLS : POINT_TOOLS);
      e.lookAt = target;
      e.expression = 'happy';
      e.lean.target = dir * 4;
    },
    update: (_e, _dt, t) => t >= seconds,
    end(e) {
      e.armModeF = 'rest';
      e.props.tool = null;
      e.lookAt = null;
      e.lean.target = 0;
    },
  };
}

export function inspect(target: Vec, seconds = 2.2): Action {
  return {
    name: 'inspect',
    state: 'INSPECTING',
    start(e) {
      const dir: 1 | -1 = target.x >= e.x ? 1 : -1;
      e.facing = dir;
      e.face.target = dir;
      e.lookAt = target;
      e.expression = 'focused';
      e.lean.target = dir * 7;
      e.crouch.target = 0.25;
      e.armModeF = 'point';
      aimAt(e, target);
      e.props.tool = e.rng.pick(e.state === 'INSPECTING' ? INSPECT_TOOLS : POINT_TOOLS);
    },
    update(e, _dt, t) {
      if (t > seconds * 0.65 && e.expression === 'focused') {
        e.expression = 'happy';
        e.lean.target = 0;
        e.crouch.target = 0;
        e.squash.impulse(2);
      }
      return t >= seconds;
    },
    end(e) {
      e.lookAt = null;
      e.lean.target = 0;
      e.crouch.target = 0;
      e.armModeF = 'rest';
      e.props.tool = null;
    },
  };
}

/** A little show-off while idle: sip from a mug, wave a flag, twirl a wand. */
export function flourish(tool?: Tool): Action {
  let t0: Tool = 'mug';
  return {
    name: 'flourish',
    state: 'WAVING',
    start(e) {
      t0 = tool ?? e.rng.pick(['mug', 'flag', 'wand', 'sword'] as const);
      e.props.tool = t0;
      e.expression = t0 === 'mug' ? 'closed' : 'happy';
      if (t0 === 'mug') e.armModeF = 'hold';
      else {
        e.armModeF = 'point';
        e.pointAngle = 2.35;
      }
    },
    update(e, _dt, t) {
      if (t0 !== 'mug') e.pointAngle = 2.35 + Math.sin(t * 9) * 0.28; // wave it about
      return t >= 2.2;
    },
    end(e) {
      e.props.tool = null;
      e.armModeF = 'rest';
    },
  };
}

export function think(seconds: number | (() => boolean)): Action {
  return {
    name: 'think',
    state: 'THINKING',
    start(e) {
      e.armModeF = 'think';
      e.expression = 'focused';
      e.mouth = 'dots';
      e.props.think = true;
      e.lookAt = null;
      e.saccade = { x: 1.6 * e.facing, y: -1.2 };
      e.nextSaccade = e.time + 99;
    },
    update: (_e, _dt, t) => (typeof seconds === 'number' ? t >= seconds : seconds()),
    end(e) {
      e.armModeF = 'rest';
      e.expression = 'neutral';
      e.mouth = 'smile';
      e.props.think = false;
      e.nextSaccade = e.time;
    },
  };
}

export function speak(seconds: number, expression: Expression = 'happy'): Action {
  return {
    name: 'speak',
    state: 'SPEAKING',
    start(e) {
      e.expression = expression;
      e.mouth = 'talk';
      e.say(seconds);
    },
    update(e, _dt, t) {
      e.lean.target = Math.sin(t * 5) * 1.5;
      return t >= seconds;
    },
    end(e) {
      e.mouth = 'smile';
      e.lean.target = 0;
      e.talkUntil = 0;
    },
  };
}

export function celebrate(): Action {
  let hopped = 0;
  return {
    name: 'celebrate',
    state: 'CELEBRATING',
    start(e) {
      e.armModeF = 'up';
      e.armModeB = 'up';
      e.expression = 'happy';
      e.mouth = 'grin';
      e.props.confettiAt = e.time;
    },
    update(e, _dt, t) {
      // two small in-place hops with squash, no locomotion
      const hopT = [0.05, 0.55];
      if (hopped < hopT.length && t >= hopT[hopped]!) {
        hopped++;
        e.squash.impulse(5);
        e.crouch.impulse(-6);
      }
      return t >= 1.5;
    },
    end(e) {
      e.armModeF = e.costume === 'trophy' ? 'hold' : 'rest';
      e.armModeB = 'rest';
      e.mouth = 'smile';
    },
  };
}

export function lookAround(seconds = 2.2): Action {
  const points: Vec[] = [];
  return {
    name: 'look-around',
    state: 'LOOKING',
    start(e) {
      points.length = 0;
      points.push({ x: -2.4 * e.facing, y: -0.6 }, { x: 2.2 * e.facing, y: 0.4 }, { x: 0, y: -1.3 });
      e.lookAt = null;
      e.nextSaccade = e.time + 99;
    },
    update(e, _dt, t) {
      const i = Math.min(points.length - 1, Math.floor((t / seconds) * points.length));
      e.saccade = points[i]!;
      e.lean.target = points[i]!.x * 0.8;
      return t >= seconds;
    },
    end(e) {
      e.nextSaccade = e.time;
      e.lean.target = 0;
    },
  };
}

export function shiftWeight(): Action {
  return {
    name: 'shift-weight',
    state: 'IDLE',
    start(e) {
      e.lean.target = e.rng.range(-4, 4);
      e.crouch.impulse(1.5);
    },
    update(e, _dt, t) {
      if (t > 0.9) e.lean.target = 0;
      return t >= 1.4;
    },
  };
}

export function stretch(): Action {
  return {
    name: 'stretch',
    state: 'IDLE',
    start(e) {
      e.armModeF = 'up';
      e.armModeB = 'up';
      e.squash.target = 1.12;
      e.expression = 'closed';
      e.mouth = 'o';
    },
    update(e, _dt, t) {
      if (t > 1.0) {
        e.squash.target = 1;
        e.armModeF = 'rest';
        e.armModeB = 'rest';
        e.expression = 'neutral';
        e.mouth = 'smile';
      }
      return t >= 1.4;
    },
  };
}

/** Drowsy nods, then sleep until woken (never completes on its own). */
export function doze(): Action {
  let slept = false;
  return {
    name: 'doze',
    state: 'DROWSY',
    start(e) {
      e.expression = 'sleepy';
      e.mouth = 'flat';
      e.lookAt = null;
    },
    update(e, _dt, t) {
      if (!slept) {
        e.lean.target = Math.sin(t * 1.6) > 0.85 ? 6 : 0; // head-nod
        if (t > 4.5) {
          slept = true;
          e.enter('SLEEPING', 'fell asleep');
          e.expression = 'closed';
          e.mouth = 'none';
          e.sit.target = 1;
          e.props.zzz = true;
          e.lean.target = 0;
        }
      }
      return false;
    },
    end(e) {
      e.props.zzz = false;
    },
  };
}

export function wake(): Action {
  return {
    name: 'wake',
    state: 'WAKING',
    start(e) {
      e.props.zzz = false;
      e.sit.target = 0;
      e.expression = 'surprised';
      e.mouth = 'o';
      e.squash.impulse(6);
      e.crouch.impulse(-8);
      e.lid.snap(1);
    },
    update(e, _dt, t) {
      // head shake: eyes dart left/right
      if (t > 0.35 && t < 0.9) e.saccade = { x: Math.sin(t * 28) * 2.4, y: 0 };
      if (t > 0.9) {
        e.expression = 'neutral';
        e.mouth = 'smile';
      }
      return t >= 1.1;
    },
    end(e) {
      e.nextSaccade = e.time;
    },
  };
}

/** Byte stands up out of the logo's cursor glyph: eyes open, legs grow, overshooting pop. */
export function emerge(fromScale: number): Action {
  return {
    name: 'emerge',
    state: 'ENTERING',
    start(e) {
      e.size.snap(fromScale);
      e.legExtend.snap(0);
      e.lid.snap(0);
      e.opacity.snap(1);
      e.expression = 'neutral';
      e.mouth = 'none';
    },
    update(e, _dt, t) {
      if (t > 0.18 && e.lid.target === 0) e.lid.target = 1;
      if (t > 0.2) e.expression = 'surprised';
      if (t > 0.42) {
        const k = clamp((t - 0.42) / 0.38, 0, 1);
        e.legExtend.snap(easeOutBack(k, 1.4));
        e.size.snap(fromScale + (1 - fromScale) * easeOutBack(k, 1.2));
      }
      if (t > 0.85 && t < 1.5) e.saccade = { x: t < 1.15 ? -2.2 : 2.2, y: -0.4 };
      if (t > 1.5) {
        e.expression = 'happy';
        e.mouth = 'smile';
      }
      return t >= 1.75;
    },
    end(e) {
      e.size.snap(1);
      e.legExtend.snap(1);
      e.nextSaccade = e.time;
    },
  };
}

/** Reverse of emerge, used when the visitor turns Byte off. */
export function retract(toScale: number): Action {
  return {
    name: 'retract',
    state: 'EXITING',
    update(e, _dt, t) {
      const k = easeInOutCubic(clamp(t / 0.45, 0, 1));
      e.legExtend.snap(1 - k);
      e.size.snap(1 + (toScale - 1) * k);
      e.lid.target = t > 0.3 ? 0 : 1;
      return t >= 0.5;
    },
    end(e) {
      e.machine.to('HIDDEN', 'retracted');
    },
  };
}

/** Instant relocation for reduced-motion: cross-fade out, move, fade in. */
export function fadeTo(x: number, y: number): Action {
  let moved = false;
  return {
    name: 'fade-to',
    state: 'IDLE',
    start(e) {
      e.opacity.target = 0;
    },
    update(e, _dt, t) {
      if (!moved && t > 0.18) {
        moved = true;
        e.place(x, y);
        e.opacity.target = 1;
      }
      return t > 0.36;
    },
    end(e) {
      e.opacity.snap(1);
    },
  };
}

export function setCostume(c: Costume): Action {
  return {
    name: `costume:${c}`,
    state: 'IDLE',
    start(e) {
      if (e.costume !== c) {
        e.costume = c;
        e.props.sparkleAt = e.time;
        e.squash.impulse(3);
      }
      e.armModeF = c === 'trophy' ? 'hold' : 'rest';
    },
    update: () => true,
  };
}

/** Drag: Byte follows the pointer with a little lag and dangles. */
export function dragged(get: () => Vec, released: () => boolean): Action {
  return {
    name: 'dragged',
    state: 'DRAGGED',
    start(e) {
      e.grounded = false;
      e.expression = 'surprised';
      e.mouth = 'o';
      e.armModeF = 'out';
      e.armModeB = 'out';
      e.tuck.target = 0;
    },
    update(e, dt) {
      const p = get();
      const nx = e.x + (p.x - e.x) * Math.min(1, dt * 18);
      const ny = e.y + (p.y - e.y) * Math.min(1, dt * 18);
      e.vx = (nx - e.x) / dt;
      e.vy = (ny - e.y) / dt;
      e.x = nx;
      e.y = ny;
      e.dangle.target = clamp(-e.vx / 60, -25, 25);
      e.lean.target = e.dangle.value;
      return released();
    },
    end(e) {
      e.armModeF = 'rest';
      e.armModeB = 'rest';
      e.dangle.target = 0;
    },
  };
}

/** External drive (used by the page-transition cloth): position comes from the caller. */
export function driven(get: () => Vec | null): Action {
  return {
    name: 'driven',
    state: 'TRANSITIONING',
    update(e, dt) {
      const p = get();
      if (!p) return true;
      e.vx = (p.x - e.x) / Math.max(dt, 1e-4);
      e.x = p.x;
      e.y = p.y;
      e.grounded = true;
      return false;
    },
    end(e) {
      e.vx = 0;
    },
  };
}
