'use client';

import { useEffect, useRef, useState } from 'react';
import { useByte, useScene } from '@/components/byte/ByteContext';
import type { Flow } from '@/content/projects';

/**
 * An accessible ordered list drawn as a pipeline. When Byte inspects it (scene event)
 * or a visitor hovers/focuses it, the steps light up in order like a request flowing through.
 */
export function SceneFlow({ flow, scene, id, compact = false }: { flow: Flow; scene?: string; id?: string; compact?: boolean }) {
  const [active, setActive] = useState(-1);
  const timers = useRef<number[]>([]);
  const { reducedMotion } = useByte();

  const play = () => {
    if (reducedMotion) return;
    timers.current.forEach(clearTimeout);
    timers.current = flow.steps.map((_, i) => window.setTimeout(() => setActive(i), 120 + i * 320));
    timers.current.push(window.setTimeout(() => setActive(-1), 120 + flow.steps.length * 320 + 900));
  };
  useScene(scene ?? '__none__', play);
  const fig = useRef<HTMLElement>(null);
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  });
  // play by itself when it scrolls into view: no hover needed
  useEffect(() => {
    const el = fig.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => en.isIntersecting && playRef.current()), { threshold: 0.6 });
    io.observe(el);
    const pending = timers.current;
    return () => {
      io.disconnect();
      pending.forEach(clearTimeout);
    };
  }, []);

  return (
    <figure ref={fig} id={id} className="m-0" onMouseEnter={play}>
      <ol className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {flow.steps.map((s, i) => {
          const lit = i <= active && active >= 0;
          return (
            <li
              key={s.label}
              className={`relative rounded-xl border px-3 py-2.5 transition-[border-color,background-color,transform] duration-300 ${
                lit ? 'border-accent/70 bg-accent/[0.08]' : 'border-line bg-bg/40'
              } ${i === active ? 'scale-[1.02]' : ''}`}
              style={{ transitionTimingFunction: 'var(--ease-out)' }}
            >
              <span className="flex items-center gap-2 font-mono text-[0.7rem] text-faint">
                <span className={`inline-flex size-4 items-center justify-center rounded-full text-[0.6rem] ${lit ? 'bg-accent text-bg' : 'border border-line-strong'}`}>
                  {lit ? '✓' : i + 1}
                </span>
                step {i + 1}
              </span>
              <span className="mt-1 block text-[0.92rem] font-semibold text-text">{s.label}</span>
              {!compact && <span className="mt-0.5 block text-[0.82rem] leading-snug text-muted">{s.detail}</span>}
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-3 text-[0.85rem] text-faint">{flow.caption}</figcaption>
    </figure>
  );
}
