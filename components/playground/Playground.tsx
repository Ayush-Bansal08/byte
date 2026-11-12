'use client';

import { useEffect, useRef, useState } from 'react';
import { ByteFigure, type ByteFigureHandle } from '@/components/byte/ByteFigure';
import {
  ByteEngine,
  COSTUMES,
  FIXED_DT,
  celebrate,
  doze,
  emerge,
  inspect,
  jumpTo,
  lookAround,
  setCostume,
  speak,
  think,
  turn,
  walkTo,
  wake,
  wave,
  type Action,
  type Costume,
} from '@/lib/byte/engine';
import { TRANSITIONS, type ByteState, type TransitionRecord } from '@/lib/byte/machine';
import { computePose } from '@/lib/byte/rig';

type Plat = { id: string; l: number; r: number; y: number };

function layout(w: number, h: number): { floor: number; plats: Plat[] } {
  const floor = h - 26;
  return {
    floor,
    plats: [
      { id: 'low', l: w * 0.56, r: w * 0.56 + Math.max(80, w * 0.15), y: floor - 74 },
      { id: 'high', l: w * 0.78, r: w * 0.78 + Math.max(70, w * 0.16), y: floor - 150 },
    ],
  };
}

const INTENTS = [
  { amount: 5, label: 'Swap $5 ETH → USDC' },
  { amount: 60, label: 'Swap $60 ETH → USDC' },
  { amount: 500, label: 'Swap $500 ETH → USDC' },
];
const CHECKS = ['Score', 'Simulate', 'Guard', 'Policy'];

export function Playground() {
  const stage = useRef<HTMLDivElement>(null);
  const fig = useRef<ByteFigureHandle>(null);
  const engineRef = useRef<ByteEngine | null>(null);
  const geo = useRef<{ w: number; h: number; floor: number; plats: Plat[] }>({ w: 600, h: 340, floor: 314, plats: [] });
  const [dims, setDims] = useState<{ w: number; h: number; plats: Plat[]; floor: number } | null>(null);
  const [state, setState] = useState<ByteState>('HIDDEN');
  const [log, setLog] = useState<TransitionRecord[]>([]);
  const [costume, setCost] = useState<Costume>('none');
  const [phys, setPhys] = useState({ gravity: 2600, walkSpeed: 150, jumpApex: 70 });
  const [decision, setDecision] = useState<{ step: number; amount: number; verdict?: string; reason?: string } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const el = stage.current!;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const l = layout(w, h);
      geo.current = { w, h, ...l };
      setDims({ w, h, ...l });
      return l;
    };
    const l = measure();
    const engine = new ByteEngine({ scale: geo.current.w < 500 ? 1.05 : 1.3 }, 42);
    engineRef.current = engine;
    engine.machine.reset('HIDDEN');
    engine.place(geo.current.w * 0.22, l.floor);
    engine.run([emerge(0.4), wave(1.2)]);
    const off = engine.machine.subscribe((s) => {
      setState(s);
      setLog([...engine.machine.history].slice(-8).reverse());
    });

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (acc >= FIXED_DT) {
        engine.step(FIXED_DT);
        acc -= FIXED_DT;
      }
      fig.current?.apply(computePose(engine, acc / FIXED_DT));
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      engine.setPointer({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const ro = new ResizeObserver(() => {
      const nl = measure();
      if (engine.grounded && !engine.busy) engine.place(Math.min(engine.x, geo.current.w - 30), nl.floor);
    });
    ro.observe(el);
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      off();
      engine.clear();
    };
  }, []);

  useEffect(() => {
    const e = engineRef.current;
    if (e) e.cfg = { ...e.cfg, ...phys };
  }, [phys]);

  const E = () => engineRef.current!;
  const surfaceAt = (x: number) => {
    const { plats, floor } = geo.current;
    return plats.find((p) => x >= p.l && x <= p.r) ?? { id: 'floor', l: 0, r: geo.current.w, y: floor };
  };
  const goTo = (x: number, y: number) => {
    const e = E();
    const wakeFirst: Action[] = e.state === 'SLEEPING' || e.state === 'DROWSY' ? [wake()] : [];
    const onSame = Math.abs(e.y - y) < 2;
    const dir: 1 | -1 = x >= e.x ? 1 : -1;
    if (onSame) e.run([...wakeFirst, ...(dir !== e.facing ? [turn(dir)] : []), walkTo(x)]);
    else e.run([...wakeFirst, jumpTo(x, y)]);
  };
  const run = (a: Action[]) => {
    const e = E();
    e.run(e.state === 'SLEEPING' || e.state === 'DROWSY' ? [wake(), ...a] : a);
  };

  const onStageClick = (ev: React.MouseEvent) => {
    const r = stage.current!.getBoundingClientRect();
    const x = Math.max(24, Math.min(geo.current.w - 24, ev.clientX - r.left));
    const y = ev.clientY - r.top;
    const plat = geo.current.plats.find((p) => x >= p.l && x <= p.r && Math.abs(y - p.y) < 40);
    if (plat) goTo(Math.max(plat.l + 16, Math.min(plat.r - 16, x)), plat.y);
    else goTo(x, geo.current.floor);
  };

  const runDecision = (amount: number) => {
    timers.current.forEach(clearTimeout);
    const e = E();
    let done = false;
    run([think(() => done)]);
    setDecision({ step: -1, amount });
    CHECKS.forEach((_, i) => timers.current.push(window.setTimeout(() => setDecision((d) => d && { ...d, step: i }), 450 + i * 450)));
    timers.current.push(
      window.setTimeout(() => {
        done = true;
        const verdict = amount <= 50 ? 'AUTO' : amount <= 250 ? 'ASK' : 'REFUSE';
        const reason =
          verdict === 'AUTO'
            ? `$${amount} is under the auto limit: run after a 3-second countdown you can cancel.`
            : verdict === 'ASK'
              ? `$${amount} is over the auto limit: wait for the owner’s approval.`
              : `$${amount} exceeds the hard limit: refuse and explain why.`;
        setDecision({ step: CHECKS.length, amount, verdict, reason });
        if (verdict === 'AUTO') e.run([celebrate()], { append: true });
        else if (verdict === 'ASK') e.run([speak(1.6, 'neutral')], { append: true });
        else {
          e.expression = 'wince';
          e.run([speak(1.6, 'wince')], { append: true });
        }
      }, 450 + CHECKS.length * 450),
    );
  };

  const doAction = (label: string) => {
    const e = E();
    const { plats, floor, w } = geo.current;
    switch (label) {
      case 'Walk': {
        const sf = surfaceAt(e.x);
        const lo = sf.l + 24;
        const hi = sf.r - 24;
        goTo(lo + e.rng.next() * (hi - lo), sf.y);
        break;
      }
      case 'Jump': {
        const onFloor = Math.abs(e.y - floor) < 2;
        const t = onFloor ? plats[0]! : Math.abs(e.y - plats[0]!.y) < 2 ? plats[1]! : null;
        if (t) goTo((t.l + t.r) / 2, t.y);
        else goTo(w * 0.3, floor);
        break;
      }
      case 'Wave':
        return run([wave(1.6)]);
      case 'Look around':
        return run([lookAround(2.2)]);
      case 'Inspect':
        return run([inspect({ x: w * 0.5, y: floor - 20 }, 2.2)]);
      case 'Think':
        return run([think(2)]);
      case 'Celebrate':
        return run([celebrate()]);
      case 'Sleep':
        if (e.state !== 'SLEEPING' && e.state !== 'DROWSY') e.run([doze()]);
        return;
      case 'Wake up':
        if (e.state === 'SLEEPING' || e.state === 'DROWSY') e.run([wake()]);
        return;
    }
  };
  const ACTION_LABELS = ['Walk', 'Jump', 'Wave', 'Look around', 'Inspect', 'Think', 'Celebrate', 'Sleep', 'Wake up'];

  return (
    <div className="space-y-6">
      <div
        ref={stage}
        onClick={onStageClick}
        className="relative h-[300px] cursor-crosshair overflow-hidden rounded-3xl border border-line bg-[radial-gradient(ellipse_at_50%_120%,rgb(140_229_208/0.08),transparent_60%)] sm:h-[360px]"
        role="application"
        aria-label="Byte’s stage. Use the buttons below to control Byte; clicking the floor or a platform also moves Byte there."
        data-testid="playground-stage"
        data-state={state}
      >
        {dims && (
          <>
            <div className="absolute inset-x-0 border-t border-line-strong" style={{ top: dims.floor }} />
            {dims.plats.map((p) => (
              <div key={p.id} className="absolute rounded-md border border-line-strong bg-surface" style={{ left: p.l, top: p.y, width: p.r - p.l, height: 10 }} />
            ))}
          </>
        )}
        <ByteFigure ref={fig} baseScale={1.3} />
        <p className="pointer-events-none absolute left-4 top-3 font-mono text-[0.72rem] text-faint">
          state: <span className="text-accent" data-testid="pg-state">{state}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Byte abilities">
        {ACTION_LABELS.map((label) => (
          <button key={label} type="button" onClick={() => doAction(label)} className="btn min-h-[40px] px-3.5 text-[0.88rem]">
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Costumes</h2>
          <p className="mt-1 text-[0.88rem] text-muted">Changed mid-jump on the main site.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {COSTUMES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={costume === c}
                onClick={() => {
                  setCost(c);
                  run([setCostume(c)]);
                }}
                className={`rounded-full border px-3 py-1 text-[0.82rem] transition-colors ${costume === c ? 'border-accent text-accent' : 'border-line-strong text-muted hover:text-text'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold">Physics</h2>
          <p className="mt-1 text-[0.88rem] text-muted">Fixed 120 Hz simulation, interpolated rendering.</p>
          {(
            [
              ['gravity', 'Gravity', 1200, 4200, 'px/s²'],
              ['walkSpeed', 'Walk speed', 60, 260, 'px/s'],
              ['jumpApex', 'Jump height', 20, 160, 'px'],
            ] as const
          ).map(([k, label, min, max, unit]) => (
            <label key={k} className="mt-3 block text-[0.85rem]">
              <span className="flex justify-between text-muted">
                {label}
                <span className="font-mono text-faint">
                  {phys[k]} {unit}
                </span>
              </span>
              <input type="range" min={min} max={max} value={phys[k]} onChange={(e) => setPhys((p) => ({ ...p, [k]: Number(e.target.value) }))} className="mt-1 w-full accent-[#8ce5d0]" />
            </label>
          ))}
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold">State machine</h2>
          <p className="mt-1 text-[0.88rem] text-muted">
            From <span className="font-mono text-accent">{state}</span>, legal next states:
          </p>
          <p className="mt-2 font-mono text-[0.72rem] leading-relaxed text-faint">{TRANSITIONS[state].join(' · ')}</p>
          <ol className="mt-3 space-y-0.5 font-mono text-[0.72rem]" aria-label="Recent transitions" data-testid="pg-log">
            {log.map((r, i) => (
              <li key={`${r.at}-${i}`} className={r.ok ? 'text-muted' : 'text-danger'}>
                {r.from} → {r.to} {r.ok ? '' : '(rejected)'} <span className="text-faint">{r.reason}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Watch an AI decision</h2>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-muted">
          An illustration of SAKA’s documented flow: the AI proposes, deterministic checks and a policy decide. The limits here ($50 auto, $250 hard) are illustrative, not SAKA’s real configuration.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {INTENTS.map((i) => (
            <button key={i.amount} type="button" onClick={() => runDecision(i.amount)} className="btn min-h-[40px] px-3.5 text-[0.88rem]">
              {i.label}
            </button>
          ))}
        </div>
        {decision && (
          <div className="mt-5" aria-live="polite">
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHECKS.map((c, i) => (
                <li key={c} className={`rounded-xl border px-3 py-2 text-[0.88rem] transition-colors duration-300 ${i <= decision.step ? 'border-accent/60 text-text' : 'border-line text-faint'}`}>
                  {i <= decision.step ? '✓ ' : ''}
                  {c}
                </li>
              ))}
            </ol>
            {decision.verdict && (
              <p className="mt-4 text-[0.95rem]">
                <span className={`mr-2 rounded-md px-2 py-0.5 font-mono text-[0.78rem] ${decision.verdict === 'AUTO' ? 'bg-accent/15 text-accent' : decision.verdict === 'ASK' ? 'bg-gold/15 text-gold' : 'bg-danger/15 text-danger'}`}>
                  {decision.verdict}
                </span>
                {decision.reason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
