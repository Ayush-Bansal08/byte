'use client';

import { useEffect, useRef, useState } from 'react';
import { useByte, useScene } from '@/components/byte/ByteContext';

/** Small, data-true signature visuals for project cards. Byte "operates" them via scene events. */
export function ProjectVisual({ slug, id }: { slug: string; id: string }) {
  const [run, setRun] = useState(0);
  const { reducedMotion } = useByte();
  useScene(`${slug}-visual`, () => !reducedMotion && setRun((r) => r + 1));
  const box = useRef<HTMLDivElement>(null);
  // play by itself when it scrolls into view: no hover needed
  useEffect(() => {
    const el = box.current;
    if (!el || reducedMotion) return;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => en.isIntersecting && setRun((r) => r + 1)), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);
  return (
    <div ref={box} id={id} className="rounded-xl border border-line bg-bg/50 p-3" onMouseEnter={() => !reducedMotion && setRun((r) => r + 1)}>
      {slug === 'helios' && <Canary run={run} />}
      {slug === 'dockhealer' && <Loop run={run} />}
      {slug === 'pollforge' && <Pipe run={run} />}
      {slug === 'som-gold' && <Recall run={run} reduced={reducedMotion} />}
    </div>
  );
}

function useStep(run: number, steps: number, ms: number) {
  const [i, setI] = useState(steps - 1);
  const t = useRef<number[]>([]);
  useEffect(() => {
    if (!run) return;
    t.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restart the sequence on each run
    setI(-1);
    t.current = Array.from({ length: steps }, (_, k) => window.setTimeout(() => setI(k), 200 + k * ms));
    return () => t.current.forEach(clearTimeout);
  }, [run, steps, ms]);
  return i;
}

function Canary({ run }: { run: number }) {
  const stages = [25, 50, 75, 100];
  const i = useStep(run, stages.length, 420);
  return (
    <div aria-label="Canary rollout: 25, 50, 75, then 100 percent of traffic, each gated on a 95 percent success rate">
      <div className="mb-2 flex items-center justify-between font-mono text-[0.68rem] text-faint">
        <span>canary rollout</span>
        <span>gate: success ≥ 95%</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {stages.map((s, k) => (
          <div key={s} className="space-y-1">
            <div className="h-10 overflow-hidden rounded-md bg-surface">
              <div className="h-full origin-bottom bg-accent/70 transition-transform duration-500" style={{ transform: `scaleY(${k <= i ? s / 100 : 0.04})`, transitionTimingFunction: 'var(--ease-out)' }} />
            </div>
            <div className="flex justify-between font-mono text-[0.66rem] text-muted">
              <span>{s}%</span>
              <span className={k <= i ? 'text-accent' : 'text-faint'}>{k <= i ? '✓' : '·'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loop({ run }: { run: number }) {
  const steps = ['validate', 'build', 'smoke', 'diagnose'];
  const i = useStep(run, steps.length, 380);
  return (
    <div aria-label="Repair loop: validate, build, smoke test, diagnose, bounded by a budget">
      <div className="mb-2 font-mono text-[0.68rem] text-faint">bounded repair loop · budget 3</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((s, k) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`rounded-md border px-2 py-1 font-mono text-[0.72rem] transition-colors duration-300 ${k <= i ? 'border-accent/60 text-accent' : 'border-line text-muted'}`}>{s}</span>
            {k < steps.length - 1 && <span className="text-faint">→</span>}
          </span>
        ))}
        <span className="font-mono text-[0.72rem] text-faint">↺</span>
      </div>
    </div>
  );
}

function Pipe({ run }: { run: number }) {
  const steps = ['Flask', 'Redis', '.NET', 'Postgres', 'Node'];
  const i = useStep(run, steps.length, 300);
  return (
    <div aria-label="Vote flow: Flask, Redis queue, .NET worker, PostgreSQL, Node.js live results">
      <div className="mb-2 font-mono text-[0.68rem] text-faint">one vote, five services</div>
      <div className="flex items-center justify-between gap-1">
        {steps.map((s, k) => (
          <span key={s} className="flex flex-1 items-center gap-1">
            <span className={`flex-1 rounded-md border py-1 text-center font-mono text-[0.68rem] transition-colors duration-300 ${k <= i ? 'border-accent/60 text-accent' : 'border-line text-muted'}`}>{s}</span>
            {k < steps.length - 1 && <span className="text-[0.7rem] text-faint">›</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function Recall({ run, reduced }: { run: number; reduced: boolean }) {
  const [v, setV] = useState(76.6);
  useEffect(() => {
    if (!run || reduced) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restart the count-up
    setV(0);
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 1100);
      setV(76.6 * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reduced]);
  return (
    <div aria-label="Mineral recall on the target unit went from 0 percent to 76.6 percent after the fix">
      <div className="mb-2 flex justify-between font-mono text-[0.68rem] text-faint">
        <span>target-unit recall</span>
        <span>before 0%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-accent/80" style={{ width: `${v}%` }} />
      </div>
      <div className="mt-1.5 text-right font-mono text-[0.78rem] text-accent">{v.toFixed(1)}%</div>
    </div>
  );
}
