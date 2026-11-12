'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ByteEngine, FIXED_DT, driven, type Vec } from '@/lib/byte/engine';
import { clamp, easeInOutCubic } from '@/lib/byte/math';
import { computePose } from '@/lib/byte/rig';
import { sound } from '@/lib/byte/sound';
import { ByteFigure, type ByteFigureHandle } from '@/components/byte/ByteFigure';
import { useByte } from '@/components/byte/ByteContext';

type Job = { href: string; label: string; command: string };
type Ctx = { navigate: (href: string, label?: string) => void; busy: boolean };
const TransitionCtx = createContext<Ctx | null>(null);

const COVER_MS = 560;
const REVEAL_MS = 540;
const MAX_WAIT_MS = 2200;

function describe(href: string, label?: string): Job {
  const path = href.split('#')[0] || '/';
  const raw = path.split('/').filter(Boolean).pop() ?? '';
  const name = label ?? (path === '/' ? 'Home' : raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, ' '));
  const hash = href.split('#')[1];
  const command = path === '/' ? (hash ? `cd ~ && open #${hash}` : 'cd ~') : `cd ~${path}`;
  return { href, label: name, command };
}

const emit = (phase: 'start' | 'end') => window.dispatchEvent(new CustomEvent('byte:transition', { detail: { phase } }));

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { enabled, reducedMotion } = useByte();
  const [job, setJob] = useState<Job | null>(null);
  const pathRef = useRef(pathname);
  const arrivedRef = useRef<string | null>(null);

  useEffect(() => {
    pathRef.current = pathname;
    arrivedRef.current = pathname;
  }, [pathname]);

  /** Same-page targets ("/#experience" while on "/") jump instantly behind the curtain. */
  const jumpToHash = useCallback((href: string, behavior: ScrollBehavior) => {
    const id = href.split('#')[1];
    const el = id ? document.getElementById(id) : null;
    if (el) el.scrollIntoView({ behavior, block: 'start' });
    else window.scrollTo({ top: 0, behavior });
    if (id && window.location.hash !== `#${id}`) history.replaceState(history.state, '', `#${id}`);
  }, []);

  const navigate = useCallback(
    (href: string, label?: string) => {
      if (job) return; // one at a time; the running one finishes quickly
      const samePage = (href.split('#')[0] || '/') === pathRef.current;
      if (!enabled || reducedMotion) {
        if (samePage) jumpToHash(href, reducedMotion ? 'auto' : 'smooth');
        else router.push(href);
        return;
      }
      if (!samePage) router.prefetch(href.split('#')[0] || '/');
      arrivedRef.current = null;
      setJob(describe(href, label));
    },
    [enabled, reducedMotion, router, job, jumpToHash],
  );

  const cover = useCallback(
    (href: string) => {
      const path = href.split('#')[0] || '/';
      if (path === pathRef.current) {
        jumpToHash(href, 'instant');
        arrivedRef.current = path;
      } else router.push(href, { scroll: false });
    },
    [router, jumpToHash],
  );

  /** Called while the page is still covered: settle the scroll position instantly. */
  const settle = useCallback((href: string) => jumpToHash(href.includes('#') ? href : `${href}#`, 'instant'), [jumpToHash]);

  const finish = useCallback(() => {
    setJob(null);
    emit('end');
  }, []);

  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // One delegated listener for every internal link on the page.
  useEffect(() => {
    const internal = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target && a.target !== '_self' || a.hasAttribute('download')) return null;
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/') || /\.(pdf|txt|xml|png|svg)$/.test(href.split('#')[0]!)) return null;
      return { a, href };
    };
    const prefetched = new Set<string>();
    const onOver = (e: Event) => {
      const hit = internal(e);
      if (!hit) return;
      const path = hit.href.split('#')[0] || '/';
      if (prefetched.has(path) || path === pathRef.current) return;
      prefetched.add(path);
      router.prefetch(path);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const hit = internal(e);
      if (!hit) return;
      const path = hit.href.split('#')[0] || '/';
      if (path === pathRef.current) return; // same page: native hash scrolling
      e.preventDefault();
      navigateRef.current(hit.href, hit.a.dataset.transitionLabel || undefined);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('focusin', onOver);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onOver);
    };
  }, [router]);

  return (
    <TransitionCtx.Provider value={{ navigate, busy: !!job }}>
      {children}
      {job && (
        <Curtain
          key={job.href}
          job={job}
          onCovered={() => cover(job.href)}
          beforeReveal={() => settle(job.href)}
          isArrived={() => arrivedRef.current !== null && arrivedRef.current === (job.href.split('#')[0] || '/')}
          onDone={finish}
        />
      )}
    </TransitionCtx.Provider>
  );
}

export function useTransitionNav() {
  return useContext(TransitionCtx);
}

function Curtain({
  job,
  onCovered,
  beforeReveal,
  isArrived,
  onDone,
}: {
  job: Job;
  onCovered: () => void;
  beforeReveal: () => void;
  isArrived: () => boolean;
  onDone: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const edge = useRef<SVGPathElement>(null);
  const figure = useRef<ByteFigureHandle>(null);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 640;
    const engine = new ByteEngine(mobile ? { scale: 1, stride: 13 } : { scale: 1.3, stride: 17 }, 7);
    engine.machine.reset('IDLE');
    engine.facing = -1;
    engine.face.snap(-1);
    engine.expression = 'focused';
    engine.mouth = 'flat';
    engine.armModeF = 'pull';
    let pos: Vec | null = { x: vw + 40, y: vh - 18 };
    engine.place(pos.x, pos.y);
    engine.run([driven(() => pos)]);

    emit('start');
    sound().play('swoosh');
    let phase: 'cover' | 'hold' | 'reveal' = 'cover';
    let t0 = performance.now();
    let last = t0;
    let acc = 0;
    let raf = 0;
    let lag = 0;
    let navigated = false;
    let done = false;
    const started = t0;

    const end = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      onDone();
    };
    const go = () => {
      if (!navigated) {
        navigated = true;
        try {
          onCovered();
        } catch {
          window.location.assign(job.href);
        }
      }
    };

    const draw = (x: number, v: number) => {
      // The cloth is held at the floor by Byte; the top of the edge lags behind with speed.
      lag += (clamp(-v * 0.09, -140, 140) - lag) * 0.18;
      const p = panel.current;
      if (p) p.style.transform = `translate3d(${x}px,0,0)`;
      const path = edge.current;
      if (path) {
        const top = lag;
        const mid = lag * 0.45;
        const W = vw + 60;
        path.setAttribute('d', `M ${top} 0 Q ${mid} ${vh * 0.55} 0 ${vh} L ${W} ${vh} Q ${W + mid} ${vh * 0.45} ${W + top} 0 Z`);
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let x: number;
      if (phase === 'cover') {
        const k = clamp((now - t0) / COVER_MS, 0, 1);
        x = vw + 40 - (vw + 60) * easeInOutCubic(k);
        if (k >= 1) {
          phase = 'hold';
          t0 = now;
          go();
        }
      } else if (phase === 'hold') {
        x = -20;
        if ((isArrived() && now - t0 > 140) || now - t0 > MAX_WAIT_MS) {
          beforeReveal();
          sound().play('swoosh');
          phase = 'reveal';
          t0 = now;
          engine.expression = 'happy';
        }
      } else {
        const k = clamp((now - t0) / REVEAL_MS, 0, 1);
        x = -20 - (vw + 260) * easeInOutCubic(k);
        if (k >= 1) return end();
      }
      const v = (x - (pos?.x ?? x) + 18) / Math.max(dt, 1e-3);
      pos = { x: x - 18, y: vh - 18 };
      engine.lean.target = clamp(v / 120, -14, 0);
      if (phase === 'cover' && now - started > COVER_MS * 0.45) engine.expression = 'wince';
      acc += dt;
      while (acc >= FIXED_DT) {
        engine.step(FIXED_DT);
        acc -= FIXED_DT;
      }
      figure.current?.apply(computePose(engine, 1));
      draw(x, phase === 'hold' ? 0 : v);
    };
    raf = requestAnimationFrame(frame);

    // type the command while the cloth crosses
    let i = 0;
    const text = `$ ${job.command}`;
    const typer = window.setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) window.clearInterval(typer);
    }, Math.max(14, Math.floor(COVER_MS / text.length)));

    // Interrupt: Escape or browser back/forward finishes immediately.
    const skip = () => {
      go();
      end();
      // the route may still be loading: settle the scroll as soon as it arrives
      const started2 = performance.now();
      const iv = window.setInterval(() => {
        if (isArrived() || performance.now() - started2 > 1500) {
          window.clearInterval(iv);
          beforeReveal();
        }
      }, 30);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skip();
    const onPop = () => end();
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    const failsafe = window.setTimeout(skip, COVER_MS + MAX_WAIT_MS + REVEAL_MS + 800);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(typer);
      window.clearTimeout(failsafe);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      engine.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per job
  }, []);

  return (
    <div aria-hidden="true" data-testid="curtain" style={{ position: 'fixed', inset: 0, zIndex: 90, pointerEvents: 'none', overflow: 'hidden' }}>
      <div ref={panel} style={{ position: 'absolute', inset: 0, transform: 'translate3d(110vw,0,0)', willChange: 'transform' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} preserveAspectRatio="none">
          <path ref={edge} fill="#111a26" stroke="rgb(140 229 208 / 0.55)" strokeWidth="1.5" />
        </svg>
        <div className="absolute inset-0 flex flex-col justify-center gap-5 px-8 sm:px-16" style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-2 font-mono text-xs text-faint">
            <span className="size-2.5 rounded-full bg-[#ff9d8a]/70" />
            <span className="size-2.5 rounded-full bg-gold/70" />
            <span className="size-2.5 rounded-full bg-accent/70" />
            <span className="ml-2">ayush@portfolio — zsh</span>
          </div>
          <p className="font-mono text-base text-accent sm:text-lg">
            {typed}
            <span className="ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] bg-accent" />
          </p>
          <p
            className="max-w-[16ch] text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl"
            style={{ color: 'transparent', WebkitTextStroke: '1.2px rgb(244 247 252 / 0.5)' }}
          >
            {job.label}
          </p>
        </div>
      </div>
      <ByteFigure ref={figure} baseScale={1.3} />
    </div>
  );
}
