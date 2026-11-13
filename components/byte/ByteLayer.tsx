'use client';

import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ByteDirector, BEHAVIORS, type Behavior, type BubbleChoice, type Perch } from '@/lib/byte/director';
import { ByteEngine, COSTUMES, FIXED_DT, MOODS, dragged, jumpTo, type Costume, type Mood, type Vec } from '@/lib/byte/engine';
import { computePose } from '@/lib/byte/rig';
import { sound } from '@/lib/byte/sound';
import { ByteFigure, type ByteFigureHandle } from './ByteFigure';
import { useByte } from './ByteContext';
import { useTransitionNav } from '@/components/transition/TransitionProvider';
import { PROJECTS } from '@/content/projects';
import type { AskResponse } from '@/lib/ai/schema';

type BubbleState = {
  text: string;
  choices?: BubbleChoice[];
  x: number;
  y: number;
  head: number;
  body: number;
  side: 'left' | 'right';
  bounds: { left: number; right: number } | null;
  tag?: string;
  key: number;
} | null;

const BASE_SCALE = 1.75;
const PROJECT_SLUGS = PROJECTS.map((p) => p.slug);
const PROJECT_NAMES: Record<string, string> = Object.fromEntries(PROJECTS.map((p) => [p.slug, p.name]));
const QUICK_HOME = ['Who is he?', 'Best project?', 'Is he available?', 'What are you?'];
const QUICK_CASE = ['How does this work?', 'What was his role?', 'What was hardest?'];
const isCostume = (c: string | undefined): c is Costume => !!c && (COSTUMES as readonly string[]).includes(c);
const isBehavior = (b: string | undefined): b is Behavior => !!b && (BEHAVIORS as readonly string[]).includes(b);
const isMood = (m: string | undefined): m is Mood => !!m && (MOODS as readonly string[]).includes(m);

function measurePerches(): Perch[] {
  const sx = window.scrollX;
  const sy = window.scrollY;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-byte-perch]'));
  const out: Perch[] = [];
  nodes.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.width < 24 || (r.width === 0 && r.height === 0)) return; // hidden at this breakpoint
    const d = el.dataset;
    const left = r.left + sx;
    const right = r.right + sx;
    const align = d.align ?? 'right';
    const standX = align === 'left' ? left + 30 : align === 'center' ? (left + right) / 2 : right - 34;
    let lookPoint: Vec | null = null;
    if (d.look) {
      const t = document.getElementById(d.look);
      if (t) {
        const tr = t.getBoundingClientRect();
        lookPoint = { x: tr.left + sx + tr.width / 2, y: tr.top + sy + Math.min(tr.height / 2, 120) };
      }
    }
    const z = el.closest('article, li[id], section, [data-byte-zone]')?.getBoundingClientRect();
    const zone = z ? { left: z.left + sx, top: z.top + sy, right: z.right + sx, bottom: z.bottom + sy } : undefined;
    let choices: BubbleChoice[] | undefined;
    try {
      choices = d.choices ? (JSON.parse(d.choices) as BubbleChoice[]) : undefined;
    } catch {
      choices = undefined;
    }
    out.push({
      id: d.bytePerch!,
      behavior: isBehavior(d.behavior) ? d.behavior : 'none',
      costume: isCostume(d.costume) ? d.costume : 'none',
      mood: isMood(d.mood) ? d.mood : 'happy',
      message: d.message,
      scene: d.scene,
      bubble: d.bubble === 'right' ? 'right' : 'left',
      choices,
      left,
      right,
      y: r.bottom + sy,
      standX,
      lookPoint,
      order: Number(d.order ?? i),
      zone,
    });
  });
  return out;
}

/** The perch whose card/section is under the pointer (smallest zone wins), if it is on screen. */
function pickByPointer(perches: Perch[], x: number, y: number, top: number, h: number): string | null {
  let best: Perch | null = null;
  let bestArea = Infinity;
  for (const p of perches) {
    const z = p.zone;
    if (!z || x < z.left || x > z.right || y < z.top || y > z.bottom) continue;
    if (p.y < top + 70 || p.y > top + h * 0.97) continue;
    const area = (z.right - z.left) * (z.bottom - z.top);
    if (area < bestArea) {
      bestArea = area;
      best = p;
    }
  }
  return best?.id ?? null;
}

/** Perch nearest the reading line (45% down the viewport) among those on screen. */
function pickActive(perches: Perch[], top: number, h: number, current?: string | null): string | null {
  const line = top + h * 0.45;
  let best: Perch | null = null;
  let bestD = Infinity;
  for (const p of perches) {
    if (p.y < top + 80 || p.y > top + h * 0.96) continue;
    const d = Math.abs(p.y - line);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  // a perch level with the best one (side-by-side cards) counts as just as good: don't yank Byte back
  const cur = current ? perches.find((p) => p.id === current) : undefined;
  if (best && cur && Math.abs(cur.y - best.y) < 40) return cur.id;
  return best?.id ?? null;
}

export function ByteLayer() {
  const pathname = usePathname();
  const { enabled, reducedMotion, directorRef, openChat, emitScene } = useByte();
  const transition = useTransitionNav();
  const figure = useRef<ByteFigureHandle>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ByteEngine | null>(null);
  const perchesRef = useRef<Perch[]>([]);
  const [bubble, setBubble] = useState<BubbleState>(null);
  const [scale, setScale] = useState(BASE_SCALE);
  const bubbleTimer = useRef<number | undefined>(undefined);
  const started = useRef(false);
  const transitioning = useRef(false);
  const hiddenRoute = pathname === '/playground';

  const showBubble = useCallback(
    (b: { text: string; choices?: BubbleChoice[]; seconds: number; side: 'left' | 'right'; perchId?: string | null; tag?: string } | null) => {
      window.clearTimeout(bubbleTimer.current);
      const e = engineRef.current;
      if (!b || !e) return setBubble(null);
      if (b.tag !== 'thinking') sound().play('blip');
      const p = b.perchId ? directorRef.current?.perches.get(b.perchId) : undefined;
      const s = e.cfg.scale;
      setBubble({
        text: b.text,
        choices: b.choices,
        side: b.side,
        x: e.x,
        y: e.y,
        head: 60 * s,
        body: 20 * s,
        bounds: p ? { left: p.left, right: p.right } : null,
        tag: b.tag,
        key: Date.now(),
      });
      bubbleTimer.current = window.setTimeout(() => setBubble(null), (b.choices && !b.tag ? Math.max(b.seconds, 12) : b.seconds) * 1000);
    },
    [directorRef],
  );

  // ---------------------------------------------------------------- setup
  useEffect(() => {
    const mobile = window.innerWidth < 640;
    const engine = new ByteEngine(mobile ? { scale: 1.2, walkSpeed: 125, jumpApex: 58, stride: 14 } : { scale: BASE_SCALE, stride: 19, walkSpeed: 175, jumpApex: 84 }, (Math.random() * 1e9) | 0);
    engine.machine.reset('HIDDEN', 'mount');
    engine.opacity.snap(0);
    const director = new ByteDirector(engine, {
      bubble: (b) => showBubble(b),
      scene: (s) => emitScene(s),
    });
    engineRef.current = engine;
    directorRef.current = director;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hit area size depends on the viewport-chosen engine scale
    setScale(engine.cfg.scale);
    // Logo state lives on the cursor element itself: touching <html> would restyle the whole page.
    const logo = () => document.querySelector<HTMLElement>('[data-byte-logo]');
    const setLogo = (v: 'home' | 'entering' | 'out') => {
      const el = logo();
      if (el && el.dataset.state !== v) el.dataset.state = v;
    };
    const setFrontLayer = (on: boolean) => {
      const L = layerRef.current;
      if (L) L.style.zIndex = on ? '60' : '30';
    };
    const offSfx = engine.on((ev) => {
      if (ev.type === 'landed') sound().play('land');
      else if (ev.type === 'action' && ev.phase === 'start' && ev.name.startsWith('jump')) sound().play('jump', 0.8);
      else if (ev.type === 'state' && ev.state === 'WAKING') sound().play('chirp');
      else if (ev.type === 'state' && ev.state === 'CELEBRATING') sound().play('sparkle');
    });
    const offState = engine.on((ev) => {
      if (ev.type !== 'state') return;
      if (ev.state === 'ENTERING') setLogo('entering');
      else if (ev.state === 'HIDDEN') {
        if (director.mode === 'off') setLogo('home');
      } else setLogo('out');
      setFrontLayer(ev.state === 'ENTERING' || (ev.prev === 'ENTERING' && ev.state === 'JUMPING'));
    });

    // ---- frame loop: fixed-step simulation, interpolated rendering
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let shown = '';
    // Phones draw every frame while Byte is on the move (walks, jumps, flips, drags are where smoothness
    // shows) and at 30fps while it stands still. Physics always runs at 120Hz and is interpolated.
    const calmFrameMs = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640 ? 32 : 0;
    const MOVING = new Set(['ENTERING', 'WALKING', 'TURNING', 'JUMPING', 'LANDING', 'RECOVERING', 'CELEBRATING', 'DRAGGED', 'EXITING', 'TRANSITIONING']);
    let lastDraw = 0;
    let lastCostume = engine.costume;
    let lastTool: string | null = null;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (engine.costume !== lastCostume) {
        if (engine.state !== 'HIDDEN') sound().play('pop');
        lastCostume = engine.costume;
      }
      if (engine.props.tool !== lastTool) {
        const t = engine.props.tool;
        if (t) sound().play(t === 'sword' || t === 'wand' ? 'shing' : 'blip');
        lastTool = t;
      }
      const sig = `${engine.state}|${engine.costume}|${director.current ?? ''}|${director.mode}`;
      if (sig !== shown && layerRef.current) {
        shown = sig;
        const L = layerRef.current;
        L.dataset.state = engine.state;
        L.dataset.costume = engine.costume;
        L.dataset.perch = director.current ?? '';
        L.dataset.mode = director.mode;
      }
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      let steps = 0;
      while (acc >= FIXED_DT && steps < 12) {
        engine.step(FIXED_DT);
        director.tick();
        acc -= FIXED_DT;
        steps++;
      }
      if (engine.state === 'HIDDEN' && engine.opacity.value < 0.01) {
        figure.current?.hide();
        return;
      }
      // nothing to draw while Byte is off-screen (it keeps living, we just don't paint it)
      const vy = window.scrollY;
      if (engine.y < vy - 220 || engine.y > vy + window.innerHeight + 260) return;
      if (calmFrameMs && !MOVING.has(engine.state) && now - lastDraw < calmFrameMs) return;
      lastDraw = now;
      figure.current?.apply(computePose(engine, acc / FIXED_DT));
    };
    const startLoop = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const onVis = () => (document.hidden ? cancelAnimationFrame(raf) : startLoop());
    startLoop();
    document.addEventListener('visibilitychange', onVis);

    // ---- geometry
    const remeasure = () => {
      perchesRef.current = measurePerches();
      director.setPerches(perchesRef.current);
      const vp = { top: window.scrollY, bottom: window.scrollY + window.innerHeight, left: window.scrollX, right: window.scrollX + window.innerWidth };
      director.setViewport(vp);
      director.want(pickActive(perchesRef.current, vp.top, window.innerHeight, director.current));
      const cursor = document.querySelector<HTMLElement>('[data-byte-logo]');
      if (cursor) {
        const r = cursor.getBoundingClientRect();
        const bodyPx = 36 * engine.cfg.scale;
        director.setLogo(r.left + r.width / 2 + window.scrollX, r.bottom + window.scrollY, Math.max(0.25, r.height / bodyPx));
      }
    };
    let scrollRaf = 0;
    let lastScrollY = window.scrollY;
    let lastScrollT = performance.now();
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const top = window.scrollY;
        const now = performance.now();
        const v = (top - lastScrollY) / Math.max(1, now - lastScrollT);
        lastScrollY = top;
        lastScrollT = now;
        director.setViewport({ top, bottom: top + window.innerHeight, left: window.scrollX, right: window.scrollX + window.innerWidth });
        director.want(pickActive(perchesRef.current, top, window.innerHeight, director.current));
        director.interact('scroll');
        const st = engine.state;
        if (director.isVisible() && (st === 'IDLE' || st === 'LOOKING')) {
          engine.lookAt = { x: engine.x, y: engine.y + (v > 0 ? 400 : -400) };
          window.clearTimeout(lookTimer);
          lookTimer = window.setTimeout(() => (engine.lookAt = null), 450);
          if (Math.abs(v) > 2.5) {
            // whoosh: hold on to the hat
            engine.expression = 'surprised';
            engine.armModeF = 'up';
            engine.armModeB = 'up';
            window.clearTimeout(holdTimer);
      window.clearTimeout(dwellTimer);
            holdTimer = window.setTimeout(() => {
              if (engine.armModeF === 'up') engine.armModeF = 'rest';
              if (engine.armModeB === 'up') engine.armModeB = 'rest';
              if (engine.expression === 'surprised') engine.expression = engine.restMood;
            }, 520);
          }
        }
      });
    };
    let lookTimer = 0;
    let holdTimer = 0;
    const ro = new ResizeObserver(() => remeasure());
    ro.observe(document.body);
    // Positions can shift without the body resizing (late fonts, images, accordions).
    const poll = window.setInterval(() => !document.hidden && started.current && remeasure(), 1200);
    window.addEventListener('load', remeasure);
    window.addEventListener('scroll', onScroll, { passive: true });
    // The moment scrolling (including a phone's momentum fling) stops, Byte goes: no debounce.
    const onScrollEnd = () => {
      const top = window.scrollY;
      director.setViewport({ top, bottom: top + window.innerHeight, left: window.scrollX, right: window.scrollX + window.innerWidth });
      director.want(pickActive(perchesRef.current, top, window.innerHeight, director.current));
      director.commit();
    };
    window.addEventListener('scrollend', onScrollEnd, { passive: true });

    // ---- input
    // Byte stays near the visitor's attention: resting the pointer on a card summons it there.
    let dwellId: string | null = null;
    let dwellTimer = 0;
    const onPointer = (ev: PointerEvent) => {
      if (director.mode !== 'live') return;
      const wx = ev.clientX + window.scrollX;
      const wy = ev.clientY + window.scrollY;
      engine.setPointer({ x: wx, y: wy }, ev.pointerType === 'touch' ? 1.2 : 2.5);
      director.interact(ev.pointerType === 'touch' ? 'touch' : 'pointer');
      if (ev.pointerType === 'touch' || director.engaged) return;
      const t = ev.target as Element | null;
      if (t?.closest?.('[data-testid="chat-panel"], [data-testid="byte-bubble"], header, [data-testid="byte-hit"]')) return;
      const id = pickByPointer(perchesRef.current, wx, wy, window.scrollY, window.innerHeight);
      if (!id || id === director.desired) {
        dwellId = null;
        window.clearTimeout(dwellTimer);
        return;
      }
      if (id === dwellId) return;
      dwellId = id;
      window.clearTimeout(dwellTimer);
      dwellTimer = window.setTimeout(() => {
        if (dwellId === id) director.want(id);
      }, 150);
    };
    const onKey = () => director.interact('key');
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('keydown', onKey);

    // ---- page transitions (curtain) hand Byte over and back
    const onTransition = (ev: Event) => {
      const phase = (ev as CustomEvent<{ phase: 'start' | 'end' }>).detail.phase;
      if (phase === 'start') {
        transitioning.current = true;
        director.suppressed = true;
        director.hide();
      } else {
        transitioning.current = false;
        director.suppressed = false;
        remeasure();
        if (director.mode !== 'off' && window.location.pathname !== '/playground') director.dropIn(director.desired);
      }
    };
    window.addEventListener('byte:transition', onTransition);

    // ---- first entrance, once fonts settle so the logo is measured correctly
    const begin = () => {
      if (started.current) return;
      started.current = true;
      remeasure();
      director.lastInteraction = engine.time;
      if (window.location.pathname === '/playground') return;
      if (director.mode === 'off') return;
      if (window.scrollY < 40 && director.mode === 'live') director.enterFromLogo(director.desired);
      else director.dropIn(director.desired);
    };
    // Byte is decoration: start once the page has loaded and the main thread is idle.
    let idleId = 0;
    const schedule = () => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      idleId = ric(() => void (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(begin)), { timeout: 1500 }) as unknown as number;
    };
    const startTimer = window.setTimeout(() => (document.readyState === 'complete' ? schedule() : window.addEventListener('load', schedule, { once: true })), 120);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      window.clearTimeout(startTimer);
      window.removeEventListener('load', schedule);
      if (idleId) window.cancelIdleCallback?.(idleId);
      window.clearInterval(poll);
      window.removeEventListener('load', remeasure);
      window.clearTimeout(lookTimer);
      window.clearTimeout(holdTimer);
      window.clearTimeout(dwellTimer);
      window.clearTimeout(bubbleTimer.current);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onScrollEnd);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('byte:transition', onTransition);
      ro.disconnect();
      offState();
      offSfx();
      engine.clear();
      directorRef.current = null;
      engineRef.current = null;
      setLogo('home');
    };
  }, [directorRef, emitScene, showBubble]);

  // ---------------------------------------------------------------- mode
  useEffect(() => {
    const d = directorRef.current;
    if (!d) return;
    const mode = !enabled ? 'off' : reducedMotion ? 'static' : 'live';
    if (!started.current) {
      d.mode = mode;
      return;
    }
    if (d.mode === mode) return;
    if (mode === 'static' && d.mode === 'live') {
      d.mode = 'static';
      return;
    }
    d.setMode(mode);
  }, [enabled, reducedMotion, directorRef]);

  // ---------------------------------------------------------------- routes
  useEffect(() => {
    const d = directorRef.current;
    if (!d || !started.current) return;
    if (hiddenRoute) {
      d.suppressed = true;
      d.hide();
      return;
    }
    if (transitioning.current) return; // the curtain will hand Byte back
    // back/forward or a plain navigation: re-measure the new page and drop in
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        d.suppressed = false;
        perchesRef.current = measurePerches();
        d.setPerches(perchesRef.current, false);
        const top = window.scrollY;
        d.setViewport({ top, bottom: top + window.innerHeight, left: 0, right: window.innerWidth });
        d.want(pickActive(perchesRef.current, top, window.innerHeight, d.current));
        if (d.mode !== 'off') d.dropIn(d.desired);
      });
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [pathname, hiddenRoute, directorRef]);

  // ---------------------------------------------------------------- poke & drag
  const drag = useRef<{ id: number; sx: number; sy: number; dragging: boolean; p: Vec; released: boolean } | null>(null);
  const onDown = (ev: React.PointerEvent<HTMLButtonElement>) => {
    const e = engineRef.current;
    if (!e || directorRef.current?.mode !== 'live') return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drag.current = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, dragging: false, p: { x: e.x, y: e.y }, released: false };
  };
  const onMove = (ev: React.PointerEvent<HTMLButtonElement>) => {
    const s = drag.current;
    const e = engineRef.current;
    if (!s || !e || s.id !== ev.pointerId) return;
    const world = { x: ev.clientX + window.scrollX, y: ev.clientY + window.scrollY + 30 * e.cfg.scale };
    s.p = world;
    if (!s.dragging && Math.hypot(ev.clientX - s.sx, ev.clientY - s.sy) > 7 && e.grounded) {
      s.dragging = true;
      showBubble(null);
      e.run([dragged(() => s.p, () => s.released)]);
    }
  };
  // A cancelled drag must never leave Byte dangling: let go and hop home.
  const cancelDrag = () => {
    const s = drag.current;
    drag.current = null;
    if (!s?.dragging) return;
    s.released = true;
    const d = directorRef.current;
    const e = engineRef.current;
    const p = d?.current ? d.perches.get(d.current) : undefined;
    if (e && p) e.run([jumpTo(p.standX, p.y, { apex: 24, noAnticipation: true })], { append: true });
  };
  const onUp = (ev: React.PointerEvent<HTMLButtonElement>) => {
    const s = drag.current;
    const e = engineRef.current;
    const d = directorRef.current;
    drag.current = null;
    if (!s || !e || !d) return;
    if (s.dragging) {
      s.released = true;
      const p = d.current ? d.perches.get(d.current) : undefined;
      if (p) e.run([jumpTo(p.standX, p.y, { apex: 24, noAnticipation: true })], { append: true });
      d.interact('poke');
      return;
    }
    void ev;
    d.interact('poke');
    // a happy little hop, then the quick-ask bubble right next to Byte
    if (e.grounded && !e.busy) e.run([jumpTo(e.x, e.y, { apex: 16, anticipation: 0.08 })]);
    e.squash.impulse(5);
    e.expression = 'happy';
    const onCase = window.location.pathname.startsWith('/work/');
    d.engage(16);
    showBubble({
      text: onCase ? 'Curious about this project? Ask me.' : 'What would you like to know?',
      choices: (onCase ? QUICK_CASE : QUICK_HOME).map((q) => ({ id: `q:${q}`, label: q })).concat([{ id: 'ask', label: 'Ask anything…' }]),
      seconds: 14,
      side: 'left',
      perchId: d.current,
    });
  };

  /** Answer a quick question inside the bubble: Byte thinks, then talks. */
  const askInline = async (question: string) => {
    const d = directorRef.current;
    if (!d) return;
    const path = window.location.pathname;
    const project = path.startsWith('/work/') ? path.split('/')[2] : PROJECT_SLUGS.includes(d.current ?? '') ? d.current! : undefined;
    d.engage(25);
    showBubble({ text: '…', seconds: 15, side: 'left', perchId: d.current, tag: 'thinking' });
    d.setChat('thinking');
    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, context: { path, project } }),
      });
      const res = (await r.json()) as Partial<AskResponse> & { error?: string };
      if (!r.ok || !res.answer) throw new Error(res.error ?? 'failed');
      d.setChat(res.found ? 'speaking' : 'unknown');
      d.engage(Math.min(22, Math.max(9, res.answer.length * 0.06)));
      const target = res.action?.type === 'goto' ? res.action.target : null;
      showBubble({
        text: res.answer,
        seconds: Math.min(22, Math.max(9, res.answer.length * 0.06)),
        side: 'left',
        perchId: d.current,
        tag: res.mode === 'ai' ? 'AI answer' : 'from verified notes',
        choices: [
          ...(target ? [{ id: `go:${target}`, label: 'Show me →' }] : []),
          { id: 'ask', label: 'Ask more' },
          { id: 'look', label: 'Thanks!' },
        ],
      });
    } catch (err) {
      d.setChat('unknown');
      const msg = err instanceof Error && err.message !== 'failed' ? err.message : 'I couldn’t reach my notes just now. Try the chat?';
      showBubble({ text: msg, seconds: 8, side: 'left', perchId: d.current, choices: [{ id: 'ask', label: 'Open chat' }] });
    } finally {
      window.setTimeout(() => d.setChat('closed'), 2500);
    }
  };

  const onBubbleChoice = (id: string) => {
    setBubble(null);
    if (!id.startsWith('q:')) directorRef.current?.release();
    if (id === 'tour') document.getElementById('saka')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    else if (id === 'ask') openChat();
    else if (id.startsWith('q:')) void askInline(id.slice(2));
    else if (id.startsWith('go:')) {
      const t = id.slice(3);
      const href = PROJECT_SLUGS.includes(t) ? `/work/${t}` : t === 'top' ? '/' : `/#${t}`;
      if (transition) transition.navigate(href, PROJECT_NAMES[t] ?? t.charAt(0).toUpperCase() + t.slice(1));
      else window.location.assign(href);
    }
  };

  return (
    <div
      ref={layerRef}
      className="byte-layer"
      style={{ position: 'absolute', inset: 0, overflowX: 'clip', zIndex: 30, pointerEvents: 'none' }}
      data-testid="byte-layer"
    >
      {!hiddenRoute && (
        <ByteFigure ref={figure} baseScale={BASE_SCALE} className="byte-figure">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="byte-hit"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={cancelDrag}
            onLostPointerCapture={cancelDrag}
            style={{
              position: 'absolute',
              left: -19 * scale,
              top: -56 * scale,
              width: 38 * scale,
              height: 56 * scale,
              pointerEvents: 'auto',
              cursor: 'grab',
              touchAction: 'none',
              background: 'transparent',
              border: 0,
              borderRadius: 10,
            }}
          />
        </ByteFigure>
      )}
      {bubble && !hiddenRoute && (
        <SpeechBubble
          key={bubble.key}
          bubble={bubble}
          onChoice={onBubbleChoice}
          onClose={() => {
            setBubble(null);
            directorRef.current?.release();
          }}
        />
      )}
    </div>
  );
}

/** The bubble grows upwards from its anchor; never let it slide under the fixed navigation bar. */
function belowNav(bottom: number, height: number) {
  const minTop = window.scrollY + 76;
  return bottom - height < minTop ? minTop + height : bottom;
}

/** Phones: there is no free space beside Byte, so its lines dock to the bottom of the screen. */
const DOCK_QUERY = '(max-width: 639px)';

function SpeechBubble({ bubble, onChoice, onClose }: { bubble: NonNullable<BubbleState>; onChoice: (id: string) => void; onClose: () => void }) {
  const [docked] = useState(() => window.matchMedia(DOCK_QUERY).matches);
  return docked ? (
    <BubbleBody bubble={bubble} onChoice={onChoice} onClose={onClose} docked />
  ) : (
    <FloatingBubble bubble={bubble} onChoice={onChoice} onClose={onClose} />
  );
}

function FloatingBubble({ bubble, onChoice, onClose }: { bubble: NonNullable<BubbleState>; onChoice: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const docW = document.documentElement.clientWidth;
    const b = bubble.bounds;
    // Prefer the free space beside Byte inside its perch, so nothing on the page is covered.
    const room = b ? (bubble.side === 'left' ? bubble.x - bubble.body - b.left : b.right - (bubble.x + bubble.body)) : 0;
    if (b && room >= 170) {
      const width = Math.min(270, room - 6);
      el.style.width = `${width}px`;
      const left = bubble.side === 'left' ? bubble.x - bubble.body - width : bubble.x + bubble.body;
      setPos({ left, top: belowNav(bubble.y - 6, el.offsetHeight), width });
      return;
    }
    const width = Math.min(260, docW - 16, b ? b.right - b.left + 24 : 260);
    el.style.width = `${width}px`;
    const raw = bubble.side === 'left' ? bubble.x + 18 - width : bubble.x - 18;
    setPos({ left: Math.max(8, Math.min(docW - width - 8, raw)), top: belowNav(bubble.y - bubble.head, el.offsetHeight), width });
  }, [bubble]);
  return (
    <div
      ref={ref}
      role="status"
      data-testid="byte-bubble"
      style={{
        position: 'absolute',
        left: pos?.left ?? -9999,
        top: pos?.top ?? 0,
        transform: 'translateY(-100%)',
        pointerEvents: bubble.choices ? 'auto' : 'none',
      }}
    >
      <div
        style={{ animation: 'rise-in 150ms var(--ease-out) both', transformOrigin: bubble.side === 'left' ? '100% 100%' : '0 100%' }}
        className="rounded-2xl border border-line-strong bg-surface px-3.5 py-2.5 text-[0.9rem] leading-snug text-text shadow-[0_12px_32px_-12px_rgb(0_0_0/0.6)]"
      >
        <BubbleContent bubble={bubble} onChoice={onChoice} onClose={onClose} />
      </div>
    </div>
  );
}

/** Phone variant: a card docked above the bottom edge of the screen, outside the page flow. */
function BubbleBody({ bubble, onChoice, onClose }: { bubble: NonNullable<BubbleState>; onChoice: (id: string) => void; onClose: () => void; docked: true }) {
  return createPortal(
    <div
      role="status"
      data-testid="byte-bubble"
      data-docked=""
      className="fixed inset-x-3 z-45"
      style={{ bottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div
        style={{ animation: 'dock-in 260ms var(--ease-out) both' }}
        className="mx-auto flex max-w-105 items-start gap-3 rounded-2xl border border-accent/30 bg-surface px-3.5 py-3 text-[0.92rem] leading-snug text-text shadow-[0_18px_40px_-14px_rgb(0_0_0/0.8),0_0_0_1px_rgb(140_229_208/0.06)]"
      >
        <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true" className="mt-0.5 shrink-0">
          <rect x="1" y="1" width="28" height="32" rx="8" fill="#8ce5d0" />
          <rect x="5" y="6" width="20" height="15" rx="4" fill="#0c1119" />
          <rect x="9" y="11" width="3" height="4" rx="1" fill="#8ce5d0" />
          <rect x="18" y="11" width="3" height="4" rx="1" fill="#8ce5d0" />
        </svg>
        <div className="min-w-0 flex-1">
          <BubbleContent bubble={bubble} onChoice={onChoice} onClose={onClose} />
        </div>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:text-text">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}

function BubbleContent({ bubble, onChoice, onClose }: { bubble: NonNullable<BubbleState>; onChoice: (id: string) => void; onClose: () => void }) {
  return (
    <>
      <span className="mb-0.5 block font-mono text-[0.68rem] uppercase tracking-wider text-accent">
        Byte{bubble.tag && bubble.tag !== 'thinking' ? <span className="text-faint normal-case tracking-normal"> · {bubble.tag}</span> : null}
      </span>
      {bubble.tag === 'thinking' ? (
        <span className="inline-flex gap-1 py-1" aria-label="Byte is thinking">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
      ) : (
        // long answers scroll inside the bubble; the buttons below always stay visible
        <span className="block overflow-y-auto overscroll-contain pr-1" style={{ maxHeight: 'min(34vh, 220px)' }} tabIndex={bubble.choices ? 0 : -1}>
          {bubble.text}
        </span>
      )}
      {bubble.choices && (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {bubble.choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => (c.id === 'look' ? onClose() : onChoice(c.id))}
              className="rounded-full border border-line-strong px-2.5 py-1 text-[0.8rem] transition-colors hover:border-accent hover:text-accent"
            >
              {c.label}
            </button>
          ))}
        </span>
      )}
    </>
  );
}
