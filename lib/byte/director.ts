import {
  ByteEngine,
  celebrate,
  doze,
  emerge,
  flourish,
  fadeTo,
  inspect,
  jumpTo,
  lookAround,
  point,
  retract,
  setCostume,
  shiftWeight,
  speak,
  stretch,
  think,
  turn,
  wait,
  walkTo,
  wake,
  wave,
  type Action,
  type Costume,
  type Mood,
  type Vec,
} from './engine';
import { clamp } from './math';

export const BEHAVIORS = ['greet', 'inspect', 'point', 'celebrate', 'wave', 'think', 'study', 'none'] as const;
export type Behavior = (typeof BEHAVIORS)[number];

export type BubbleChoice = { id: string; label: string };
export type Perch = {
  id: string;
  behavior: Behavior;
  costume: Costume;
  mood: Mood;
  message?: string;
  scene?: string;
  bubble: 'left' | 'right';
  choices?: BubbleChoice[];
  /** walkable surface in world px */
  left: number;
  right: number;
  y: number;
  standX: number;
  lookPoint: Vec | null;
  order: number;
  /** the card/section this perch belongs to (world px); pointing at it summons Byte */
  zone?: { left: number; top: number; right: number; bottom: number };
};

export type Viewport = { top: number; bottom: number; left: number; right: number };
export type ChatState = 'closed' | 'open' | 'thinking' | 'speaking' | 'unknown';
export type Mode = 'live' | 'static' | 'off';

export type DirectorHooks = {
  bubble?: (b: { text: string; perchId: string | null; choices?: BubbleChoice[]; seconds: number; side: 'left' | 'right' } | null) => void;
  scene?: (scene: string) => void;
  arrive?: (perchId: string) => void;
};

const WAKE_LINES = ['Not asleep. Just garbage-collecting.', 'I was compiling. With my eyes closed.', 'Back online. Where were we?'];

export class ByteDirector {
  perches = new Map<string, Perch>();
  current: string | null = null;
  desired: string | null = null;
  desiredSince = 0;
  mode: Mode = 'live';
  chat: ChatState = 'closed';
  suppressed = false;
  viewport: Viewport = { top: 0, bottom: 800, left: 0, right: 1200 };
  lastInteraction = 0;
  sleepAfter = 32;
  private nextIdleAt = 4;
  private lastIdle = '';
  /** when Byte last spoke at each perch; it repeats itself only after a while */
  private told = new Map<string, number>();
  repeatAfter = 2;
  private stateSince = 0;
  /** if an action state lasts longer than this, something went wrong: reset and carry on */
  watchdogAfter = 10;
  /** while the visitor is talking to Byte (quick-ask bubble), it holds still and stays quiet */
  private engagedUntil = 0;
  private logo: { x: number; y: number; scale: number } | null = null;
  private relocating = false;
  /** while a bubble is up, Byte doesn't wander away from it */
  private bubbleUntil = 0;

  constructor(
    readonly engine: ByteEngine,
    private hooks: DirectorHooks = {},
  ) {
    engine.on((ev) => {
      if (ev.type === 'action' && ev.phase === 'end' && ev.name === 'relocated') this.relocating = false;
      if (ev.type === 'state') this.stateSince = engine.time;
    });
  }

  get now() {
    return this.engine.time;
  }

  engage(seconds: number) {
    this.engagedUntil = this.now + seconds;
    this.lastInteraction = this.now;
  }
  release() {
    this.engagedUntil = 0;
  }
  get engaged() {
    return this.now < this.engagedUntil;
  }

  setHooks(h: DirectorHooks) {
    this.hooks = h;
  }

  setPerches(list: Perch[], keepCurrent = true) {
    this.perches = new Map(list.map((p) => [p.id, p]));
    if (!keepCurrent || (this.current && !this.perches.has(this.current))) {
      this.current = null;
      return;
    }
    // Layout moved under Byte (fonts, images, resize): keep its feet on the surface.
    const p = this.current ? this.perches.get(this.current) : undefined;
    const e = this.engine;
    if (p && e.grounded && !this.relocating && Math.abs(e.y - p.y) > 0.5 && e.state !== 'HIDDEN') {
      const x = Math.min(Math.max(e.x, p.left + 14), p.right - 14);
      e.x = e.prevX = x;
      e.y = e.prevY = p.y;
    }
  }

  setLogo(x: number, y: number, scale: number) {
    this.logo = { x, y, scale };
  }

  setViewport(v: Viewport) {
    this.viewport = v;
  }

  isVisible(y = this.engine.y) {
    return y > this.viewport.top - 10 && y < this.viewport.bottom + 70;
  }

  /** Scroll-driven: which perch should Byte be at. Debounced in tick(). */
  want(id: string | null) {
    if (id === this.desired) return;
    this.desired = id;
    this.desiredSince = this.now;
  }

  interact(kind: 'pointer' | 'scroll' | 'key' | 'touch' | 'poke') {
    this.lastInteraction = this.now;
    const s = this.engine.state;
    if ((s === 'SLEEPING' || s === 'DROWSY') && this.mode === 'live') {
      this.engine.run([wake(), speak(1.6, 'happy')]);
      this.say(this.engine.rng.pick(WAKE_LINES), 2.6);
      this.nextIdleAt = this.now + 4;
    }
    void kind;
  }

  // ------------------------------------------------------------- lifecycle
  /** First load at the top of the page: Byte stands up out of the logo cursor. */
  enterFromLogo(firstPerch: string | null) {
    if (!this.logo || this.mode !== 'live') return this.dropIn(firstPerch);
    const { x, y, scale } = this.logo;
    this.engine.place(x, y);
    this.engine.opacity.snap(1);
    this.engine.run([emerge(scale)]);
    this.current = null;
    this.desired = firstPerch;
    this.desiredSince = -1;
    if (firstPerch) this.goTo(firstPerch, { fromLogo: true });
  }

  /** Arrive from outside the viewport (after navigation or when re-enabled mid-page). */
  dropIn(perchId: string | null) {
    this.current = null;
    this.desired = perchId;
    if (!perchId) return;
    const p = this.perches.get(perchId);
    if (!p) return;
    if (this.mode === 'static') {
      this.engine.machine.reset('IDLE');
      this.engine.place(p.standX, p.y);
      this.engine.costume = p.costume;
      this.engine.restMood = p.mood;
      this.engine.expression = p.mood;
      this.current = perchId;
      this.engine.opacity.snap(1);
      return;
    }
    this.engine.machine.reset('IDLE', 'drop-in');
    this.engine.place(p.standX + 30, this.viewport.top - 90);
    this.engine.opacity.snap(1);
    this.goTo(perchId, { offscreen: true });
  }

  hide() {
    this.engine.clear();
    this.engine.machine.reset('HIDDEN', 'hide');
    this.engine.opacity.snap(0);
    this.hooks.bubble?.(null);
  }

  setMode(mode: Mode) {
    const prev = this.mode;
    this.mode = mode;
    if (mode === 'off' && prev !== 'off') {
      this.hooks.bubble?.(null);
      if (this.logo && this.isVisible() && prev === 'live' && this.engine.state !== 'HIDDEN') {
        this.engine.run([jumpTo(this.logo.x, this.logo.y, { apex: 40 }), retract(this.logo.scale)]);
      } else this.hide();
      this.current = null;
    } else if (mode !== 'off' && prev === 'off') {
      if (this.logo && this.viewport.top < 40) this.enterFromLogo(this.desired);
      else this.dropIn(this.desired);
    }
  }

  setChat(state: ChatState, panelPoint?: Vec) {
    const prev = this.chat;
    this.chat = state;
    if (this.mode !== 'live' || this.engine.state === 'HIDDEN' || this.suppressed) return;
    const e = this.engine;
    this.lastInteraction = this.now;
    if (state === 'open' && prev === 'closed') {
      if (e.state === 'SLEEPING' || e.state === 'DROWSY') e.run([wake()]);
      e.lookAt = panelPoint ?? null;
      const dir: 1 | -1 = panelPoint && panelPoint.x < e.x ? -1 : 1;
      e.run([...(dir !== e.facing ? [turn(dir)] : []), wave(0.9)]);
    } else if (state === 'thinking') {
      e.run([think(() => this.chat !== 'thinking')]);
    } else if (state === 'speaking') {
      e.run([speak(2.2, 'happy')]);
    } else if (state === 'unknown') {
      e.expression = 'neutral';
      e.mouth = 'flat';
      e.armModeF = 'out';
      e.armModeB = 'out';
      e.run([wait(1.2, 'SPEAKING')]);
    } else if (state === 'closed') {
      e.lookAt = null;
    }
  }

  // ------------------------------------------------------------- per frame
  tick() {
    if (this.mode === 'off' || this.suppressed) return;
    const e = this.engine;
    const s = e.state;
    if (s === 'HIDDEN' || s === 'ENTERING' || s === 'TRANSITIONING' || s === 'DRAGGED') return;
    // Watchdog: no action state should last this long. Recover instead of freezing.
    const calm = s === 'IDLE' || s === 'SLEEPING' || s === 'DROWSY' || (s === 'THINKING' && this.chat === 'thinking');
    if (!calm && this.now - this.stateSince > this.watchdogAfter) {
      e.clear();
      e.machine.reset('IDLE', 'watchdog');
      this.stateSince = this.now;
      e.grounded = true;
      e.spin = 0;
      e.props.tool = null;
      e.armModeF = 'rest';
      e.armModeB = 'rest';
      e.lookAt = null;
      this.relocating = false;
      const p = this.current ? this.perches.get(this.current) : undefined;
      if (p) e.place(p.standX, p.y);
      this.current = null; // forces a fresh arrival (and its message) at the desired perch
      return;
    }
    // a replaced plan may never reach its 'relocated' marker; an empty queue means the trip is over
    if (this.relocating && !e.busy) this.relocating = false;
    if (this.engaged) return;

    // relocate once the scroll target has been stable for a moment
    if (this.desired && this.desired !== this.current && !this.relocating && this.now - this.desiredSince > 0.12 && e.grounded) {
      if (s !== 'SLEEPING' && s !== 'DROWSY' && this.chat !== 'thinking') {
        this.goTo(this.desired);
        return;
      }
    }

    if (this.mode !== 'live' || e.busy || this.chat === 'thinking') return;
    if (s !== 'IDLE' && s !== 'LOOKING') return;
    const idleFor = this.now - this.lastInteraction;
    if (idleFor > this.sleepAfter && this.chat === 'closed') {
      e.run([doze()]);
      this.hooks.bubble?.(null);
      return;
    }
    if (this.now >= this.nextIdleAt) {
      this.idleBehaviour(idleFor);
      this.nextIdleAt = this.now + e.rng.range(2.8, 7.5);
    }
  }

  private idleBehaviour(idleFor: number) {
    const e = this.engine;
    const p = this.current ? this.perches.get(this.current) : undefined;
    const wide = p ? p.right - p.left > 90 : false;
    const options: [string, number][] = [
      ['look', 3],
      ['shift', 2],
      ['face', 1.2],
      ['blink', 0.6],
    ];
    const anchored = this.now < this.bubbleUntil;
    // Side-by-side cards share a row: a guide presents both, so hop across to the one not yet shown.
    if (p && !anchored) {
      const siblings = [...this.perches.values()].filter((q) => q.id !== p.id && Math.abs(q.y - p.y) < 40 && this.isVisible(q.y));
      const fresh = siblings.find((q) => !this.told.has(q.id));
      if (fresh) {
        this.desired = fresh.id;
        this.desiredSince = this.now;
        this.goTo(fresh.id);
        return;
      }
      if (siblings.length) options.push(['sibling', 1.2]);
    }
    if (!anchored) options.push(['hop', 1.3], ['bounce', 1.2]);
    if (wide && !anchored) options.push(['pace', 3]);
    if (p?.lookPoint) options.push(['glance', 1.6]);
    if (idleFor > 12) options.push(['stretch', 1.2]);
    if (!anchored) options.push(['flourish', 1.1]);
    const choice = e.rng.weighted(options.filter(([k]) => k !== this.lastIdle));
    this.lastIdle = choice;
    switch (choice) {
      case 'look':
        e.run([lookAround(e.rng.range(1.6, 2.6))]);
        break;
      case 'shift':
        e.run([shiftWeight()]);
        break;
      case 'face': {
        const mid = (this.viewport.left + this.viewport.right) / 2;
        const dir: 1 | -1 = mid >= e.x ? 1 : -1;
        e.run(dir !== e.facing ? [turn(dir), wait(0.4)] : [lookAround(1.2)]);
        break;
      }
      case 'blink':
        e.blinkNow();
        break;
      case 'hop':
        e.run([jumpTo(e.x, e.y, { apex: 16, anticipation: 0.12 })]);
        break;
      case 'bounce': {
        // a happy double-hop in place
        e.expression = 'happy';
        e.run([jumpTo(e.x, e.y, { apex: 12, anticipation: 0.08 }), jumpTo(e.x, e.y, { apex: 22, anticipation: 0.06 })]);
        break;
      }
      case 'stretch':
        e.run([stretch()]);
        break;
      case 'flourish':
        e.run([flourish()]);
        break;
      case 'pace': {
        if (!p) break;
        const lo = p.left + 16;
        const hi = p.right - 16;
        const to = clamp(e.x + e.rng.range(-1, 1) * (hi - lo) * 0.6, lo, hi);
        const dir: 1 | -1 = to >= e.x ? 1 : -1;
        e.run([...(dir !== e.facing ? [turn(dir)] : []), walkTo(to, { speed: e.cfg.walkSpeed * 0.7 }), wait(0.5), lookAround(1.4)]);
        break;
      }
      case 'sibling': {
        const sib = [...this.perches.values()].find((q) => q.id !== p?.id && p && Math.abs(q.y - p.y) < 40 && this.isVisible(q.y));
        if (sib) {
          this.desired = sib.id;
          this.desiredSince = this.now;
          this.goTo(sib.id);
        }
        break;
      }
      case 'glance':
        if (p?.lookPoint) e.run([inspect(p.lookPoint, 1.6)]);
        break;
    }
  }

  /** Plan the trip to a perch, then the perch's arrival behaviour. */
  goTo(perchId: string, opts: { fromLogo?: boolean; offscreen?: boolean } = {}) {
    const p = this.perches.get(perchId);
    if (!p) return;
    const e = this.engine;
    this.current = perchId;
    this.hooks.bubble?.(null);
    const tx = clamp(p.standX, p.left + 14, p.right - 14);
    const ty = p.y;

    if (this.mode === 'static') {
      e.costume = p.costume;
      e.run([fadeTo(tx, ty), setCostume(p.costume), ...this.arrival(p, true)]);
      return;
    }

    const plan: Action[] = [];
    const visible = this.isVisible();
    if (!opts.fromLogo && !opts.offscreen && !visible) {
      // Byte is off-screen: re-enter from the edge nearest to its old position
      const fromBelow = e.y > this.viewport.bottom;
      e.clear();
      e.machine.reset('IDLE', 'reenter');
      e.place(tx + (tx > (this.viewport.left + this.viewport.right) / 2 ? 40 : -40), fromBelow ? this.viewport.bottom + 70 : this.viewport.top - 90);
    }
    const dy = ty - e.y;
    const dx = tx - e.x;
    const sameSurface = Math.abs(dy) < 3 && !opts.fromLogo;
    if (sameSurface && Math.abs(dx) < 200) {
      const dir: 1 | -1 = dx >= 0 ? 1 : -1;
      if (dir !== e.facing && Math.abs(dx) > 2) plan.push(turn(dir));
      if (Math.abs(dx) > 1) plan.push(walkTo(tx));
      if (p.costume !== e.costume) plan.push(setCostume(p.costume));
    } else {
      const startsBelow = e.y > this.viewport.bottom;
      const apex = startsBelow ? 30 : opts.fromLogo ? 18 : clamp(36 + Math.abs(dx) * 0.08 + Math.max(0, -dy) * 0.1, 34, 120);
      const fall = e.y < this.viewport.top;
      plan.push(
        jumpTo(tx, ty, {
          apex: fall ? 0 : apex,
          noAnticipation: fall,
          costumeAtApex: p.costume !== e.costume ? p.costume : undefined,
          anticipation: opts.fromLogo ? 0.22 : undefined,
        }),
      );
    }
    plan.push({ name: 'relocated', state: 'IDLE', update: () => true });
    this.relocating = true;
    plan.push(...this.arrival(p, false));
    e.run(plan, { append: opts.fromLogo });
    this.hooks.arrive?.(perchId);
  }

  private arrival(p: Perch, staticMode: boolean): Action[] {
    const e = this.engine;
    // the section's mood becomes Byte's resting face here
    e.restMood = p.mood;
    if (!p.message) this.told.set(p.id, this.now);
    const last = this.told.get(p.id);
    const firstTime = last === undefined || this.now - last > this.repeatAfter;
    const look = p.lookPoint;
    const out: Action[] = [];
    const sayIt = () => {
      if (p.message && firstTime) {
        this.told.set(p.id, this.now);
        const secs = clamp(p.message.length * 0.055, 2.6, 6.5);
        this.say(p.message, secs, p.choices, p.id);
        return secs;
      }
      return 0;
    };
    if (staticMode) {
      out.push({ name: 'arrive-static', state: 'IDLE', update: () => (sayIt(), true) });
      return out;
    }
    const faceVisitor = (): Action => {
      const mid = (this.viewport.left + this.viewport.right) / 2;
      return { name: 'face-visitor', state: 'TURNING', update: () => true, start: (en) => { const d: 1 | -1 = mid >= en.x ? 1 : -1; en.facing = d; en.face.target = d; } };
    };
    // Speak the moment Byte lands, then act it out (point, inspect, wave) while talking.
    let spoken = 0;
    const announce: Action = {
      name: 'announce',
      state: 'SPEAKING',
      start: (en) => {
        spoken = sayIt();
        if (spoken) {
          en.mouth = 'talk';
          en.say(Math.min(spoken, 3));
        }
      },
      update: () => true,
    };
    out.push(announce);
    const talk = (): Action => ({
      name: 'talk',
      state: 'SPEAKING',
      start: (en) => {
        if (spoken && en.time < en.talkUntil) en.mouth = 'talk';
      },
      update: (en, _dt, t) => t > 0.5 && en.time >= en.talkUntil,
      end: (en) => {
        en.mouth = 'smile';
      },
    });
    switch (p.behavior) {
      case 'greet':
        out.push(faceVisitor(), wave(1.5), talk());
        break;
      case 'inspect':
        if (look) {
          out.push({ name: 'scene', state: 'INSPECTING', update: () => (p.scene && this.hooks.scene?.(p.scene), true) });
          out.push(inspect(look, 2.6));
        }
        out.push(faceVisitor(), talk());
        break;
      case 'study':
        if (look) out.push(inspect(look, 1.8));
        out.push(think(1.1), faceVisitor(), talk());
        break;
      case 'point':
        if (look) out.push(point(look, 1.5));
        out.push(talk());
        break;
      case 'celebrate':
        out.push(faceVisitor(), celebrate(), talk());
        if (p.scene) out.push({ name: 'scene', state: 'CELEBRATING', update: () => (this.hooks.scene?.(p.scene!), true) });
        break;
      case 'wave':
        out.push(faceVisitor(), wave(1.3), talk());
        break;
      case 'think':
        out.push(think(1.4), faceVisitor(), talk());
        break;
      default:
        out.push(faceVisitor(), talk());
    }
    this.nextIdleAt = this.now + e.rng.range(3, 6);
    return out;
  }

  say(text: string, seconds: number, choices?: BubbleChoice[], perchId: string | null = this.current) {
    if (this.engaged) return; // never talk over the visitor's own question
    const p = perchId ? this.perches.get(perchId) : undefined;
    this.bubbleUntil = this.now + (choices ? Math.max(seconds, 12) : seconds);
    this.hooks.bubble?.({ text, perchId, choices, seconds, side: p?.bubble ?? 'left' });
  }
}
