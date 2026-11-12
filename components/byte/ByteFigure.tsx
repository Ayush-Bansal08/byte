'use client';

import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { ByteEngine } from '@/lib/byte/engine';
import { armPath, computePose, limbPath, type Pose } from '@/lib/byte/rig';

export type ByteFigureHandle = { apply: (pose: Pose) => void; hide: () => void; root: HTMLDivElement | null };

const C = {
  body: '#8CE5D0',
  shade: '#6CCDB6',
  limb: '#7FDCC6',
  plate: '#0B141D',
  eye: '#B6F5E6',
  gold: '#F2C14E',
  white: '#F4F7FC',
  violet: '#A9B8FF',
  pink: '#FF8FA8',
};

const EYE_DIMS: Record<string, [number, number]> = {
  neutral: [3.6, 5.6],
  surprised: [4.6, 6.8],
  focused: [4.2, 3.0],
  sleepy: [3.8, 5.6],
  sad: [3.4, 4.6],
};

const CONFETTI = Array.from({ length: 10 }, (_, i) => ({
  vx: Math.cos((i / 10) * Math.PI * 2 + 0.3) * (18 + (i % 3) * 7),
  vy: 52 + (i % 4) * 9,
  c: [C.body, C.white, C.gold, C.violet][i % 4]!,
  r: (i * 47) % 360,
}));

const initialPose = (() => {
  const e = new ByteEngine();
  e.machine.reset('IDLE');
  return computePose(e, 1);
})();

const TOOL_KEYS = ['sword', 'wand', 'pointer', 'flag', 'magnifier', 'wrench', 'mug'];
const f2 = (n: number) => n.toFixed(1); // SVG units: 0.1 ≈ 0.17px, invisible, and far fewer DOM writes
const px = (n: number) => n.toFixed(2);

/** Writes an attribute only when its value changed: most channels are static most of the time. */
function makeWriter() {
  const cache = new Map<Element, Map<string, string>>();
  return (el: Element | null | undefined, name: string, value: string) => {
    if (!el) return;
    let m = cache.get(el);
    if (!m) cache.set(el, (m = new Map()));
    if (m.get(name) === value) return;
    m.set(name, value);
    el.setAttribute(name, value);
  };
}

export function ByteFigure({
  ref,
  baseScale,
  className,
  title,
  children,
}: {
  ref?: Ref<ByteFigureHandle>;
  baseScale: number;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  // A plain registry filled by callback refs (written at commit time, read only in apply()).
  const [el] = useState(() => ({ current: {} as Record<string, SVGElement | null> }));
  const last = useRef<{ expr: string; mouth: string; costume: string; zzz: boolean; think: boolean; transform: string; opacity: string; tool: string | null | undefined }>({
    expr: '',
    mouth: '',
    costume: '',
    zzz: false,
    think: false,
    transform: '',
    opacity: '',
    tool: undefined,
  });
  const [put] = useState(makeWriter);
  const set = (k: string) => (n: SVGElement | null) => {
    el.current[k] = n;
  };

  useImperativeHandle(ref, () => ({
    root: root.current,
    hide() {
      const r = root.current;
      if (r && last.current.opacity !== '0') r.style.opacity = last.current.opacity = '0';
    },
    apply(p: Pose) {
      const r = root.current;
      const E = el.current;
      if (!r) return;
      const tr = `translate3d(${px(p.x)}px, ${px(p.y)}px, 0)`;
      const op = p.opacity < 0.999 ? p.opacity.toFixed(2) : '';
      if (last.current.transform !== tr) r.style.transform = last.current.transform = tr;
      if (last.current.opacity !== op) r.style.opacity = last.current.opacity = op;
      put(E.scale, 'transform', `scale(${(p.scale / baseScale).toFixed(3)})`);
      put(E.body, 'transform', `rotate(${f2(p.rotate)}) rotate(${f2(p.spin)} 0 -32) scale(${p.mirror.toFixed(2)} 1)`);
      put(E.torso, 'transform', `translate(0 ${f2(p.hipY)}) scale(${p.squashX.toFixed(3)} ${p.squashY.toFixed(3)})`);
      put(E.legB, 'd', limbPath(p.legs[1]));
      put(E.legF, 'd', limbPath(p.legs[0]));
      put(E.footB, 'd', `M${f2(p.legs[1].c.x - 0.6)} ${f2(p.legs[1].c.y)}h3.2`);
      put(E.footF, 'd', `M${f2(p.legs[0].c.x - 0.6)} ${f2(p.legs[0].c.y)}h3.2`);
      put(E.armB, 'd', armPath(p.arms[0]));
      put(E.armF, 'd', armPath(p.arms[1]));
      put(E.handF, 'cx', f2(p.arms[1].c.x));
      put(E.handF, 'cy', f2(p.arms[1].c.y));
      put(E.handB, 'cx', f2(p.arms[0].c.x));
      put(E.handB, 'cy', f2(p.arms[0].c.y));
      put(E.trophy, 'transform', `translate(${f2(p.arms[1].c.x)} ${f2(p.arms[1].c.y)})`);
      if (last.current.tool !== p.tool) {
        last.current.tool = p.tool;
        for (const k of TOOL_KEYS) put(E[`t-${k}`], 'display', 'none');
        if (p.tool) put(E[`t-${p.tool}`], 'display', 'inline');
      }
      if (p.tool) {
        const hand = `translate(${f2(p.arms[1].c.x)} ${f2(p.arms[1].c.y)})`;
        put(E[`t-${p.tool}`], 'transform', p.tool === 'mug' ? hand : `${hand} rotate(${f2(p.toolAngle)})`);
        if (p.tool === 'sword') put(E.swordGlow, 'opacity', f2(0.35 + 0.25 * Math.sin(p.time * 6)));
        if (p.tool === 'wand') put(E.wandStar, 'transform', `translate(16 0) rotate(${f2(p.time * 220)}) scale(${f2(1 + 0.15 * Math.sin(p.time * 9))})`);
        if (p.tool === 'pointer') put(E.laserDot, 'opacity', f2(0.6 + 0.4 * Math.sin(p.time * 14)));
        if (p.tool === 'flag') put(E.flagCloth, 'd', `M17 0 Q21 ${f2(-1.5 + Math.sin(p.time * 10) * 1.5)} 25 0 L25 -6 Q21 ${f2(-7.5 + Math.sin(p.time * 10 + 1) * 1.5)} 17 -6 Z`);
        if (p.tool === 'mug') put(E.steam, 'opacity', f2(0.4 + 0.3 * Math.sin(p.time * 4)));
      }
      put(E.face, 'transform', `translate(${f2(p.faceShift * 0.55)} 0)`);
      put(E.eyes, 'transform', `translate(${f2(p.faceShift * 0.35 + p.eyeDX)} ${f2(p.eyeDY)})`);
      put(E.mouthG, 'transform', `translate(${f2(p.eyeDX * 0.5)} ${f2(p.eyeDY * 0.4)})`);
      put(E.shadow, 'transform', `scale(${f2(p.shadow ? 1 : 0.6)} 1)`);
      put(E.shadow, 'opacity', p.shadow ? '0.38' : '0.12');

      const L = last.current;
      const rectEyes = p.expression in EYE_DIMS;
      if (L.expr !== p.expression) {
        L.expr = p.expression;
        for (const k of ['eyesRect', 'eyesHappy', 'eyesClosed', 'eyesWince', 'eyesStar', 'eyesHeart', 'eyesWink']) put(E[k], 'display', 'none');
        const named: Record<string, string> = { happy: 'eyesHappy', wince: 'eyesWince', star: 'eyesStar', heart: 'eyesHeart', wink: 'eyesWink' };
        const shown = rectEyes ? 'eyesRect' : (named[p.expression] ?? 'eyesClosed');
        put(E[shown], 'display', 'inline');
        // blush for the warm moods
        put(E.cheeks, 'display', ['happy', 'heart', 'star', 'wink'].includes(p.expression) ? 'inline' : 'none');
      }
      if (rectEyes) {
        const [w, h] = EYE_DIMS[p.expression]!;
        const hh = Math.max(0.5, h * Math.min(1, p.lid));
        for (const [k, cx] of [
          ['eyeL', -5],
          ['eyeR', 5],
        ] as const) {
          const n = E[k];
          if (!n) continue;
          put(n, 'x', f2(cx - w / 2));
          put(n, 'y', f2(-21.5 - hh / 2));
          put(n, 'width', f2(w));
          put(n, 'height', f2(hh));
        }
      }
      if (L.mouth !== p.mouth) {
        L.mouth = p.mouth;
        for (const k of ['mSmile', 'mGrin', 'mO', 'mFlat', 'mTalk', 'mDots']) put(E[k], 'display', 'none');
        const map: Record<string, string> = { smile: 'mSmile', grin: 'mGrin', o: 'mO', flat: 'mFlat', talk: 'mTalk', dots: 'mDots' };
        if (map[p.mouth]) put(E[map[p.mouth]!], 'display', 'inline');
      }
      if (p.mouth === 'talk') {
        const h = 0.7 + 2.6 * p.talk;
        put(E.mTalk, 'height', f2(h));
        put(E.mTalk, 'y', f2(-16.4 - h / 2));
      }
      if (p.mouth === 'dots') {
        [0, 1, 2].forEach((i) => put(E[`dot${i}`], 'opacity', Math.sin(p.time * 6 - i * 0.9) > 0 ? '1' : '0.25'));
      }
      if (L.costume !== p.costume) {
        L.costume = p.costume;
        for (const k of ['agent', 'helmet', 'glasses', 'party', 'cap', 'headset', 'trophy', 'crown', 'detective', 'medic', 'beanie']) put(E[`c-${k}`], 'display', 'none');
        put(E[`c-${p.costume}`], 'display', 'inline');
      }
      if (p.costume === 'agent') put(E.antennaTip, 'opacity', f2(0.55 + 0.45 * Math.sin(p.time * 4)));
      if (p.expression === 'heart' || p.expression === 'star') put(E.eyePulse, 'transform', `scale(${f2(1 + 0.08 * Math.sin(p.time * 7))})`);
      // cursor prompt on the face plate blinks like a terminal
      put(E.prompt, 'opacity', p.mouth === 'none' || Math.floor(p.time * 1.6) % 2 ? '0' : '0.8');

      // props
      if (L.zzz !== p.zzz) {
        L.zzz = p.zzz;
        if (p.zzz) put(E.zzz, 'display', 'inline');
        else put(E.zzz, 'display', 'none');
      }
      if (p.zzz) {
        [0, 1, 2].forEach((i) => {
          const k = (p.time * 0.45 + i / 3) % 1;
          const n = E[`z${i}`];
          put(n, 'transform', `translate(${f2(10 + k * 9 + Math.sin(k * 6) * 1.5)} ${f2(-56 - k * 20)}) scale(${f2(0.6 + k * 0.6)})`);
          put(n, 'opacity', f2(Math.sin(k * Math.PI)));
        });
      }
      if (L.think !== p.think) {
        L.think = p.think;
        if (p.think) put(E.thinkG, 'display', 'inline');
        else put(E.thinkG, 'display', 'none');
      }
      if (p.think) [0, 1, 2].forEach((i) => put(E[`td${i}`], 'opacity', Math.sin(p.time * 5 - i) > 0 ? '1' : '0.3'));

      const ca = p.confettiAge;
      if (ca >= 0 && ca < 1.4) {
        put(E.confetti, 'display', 'inline');
        CONFETTI.forEach((c, i) => {
          const px = c.vx * ca;
          const py = -60 - c.vy * ca + 70 * ca * ca;
          put(E[`cf${i}`], 'transform', `translate(${f2(px)} ${f2(py)}) rotate(${f2(c.r + ca * 540)})`);
        });
        put(E.confetti, 'opacity', f2(1 - Math.max(0, ca - 0.9) / 0.5));
      } else put(E.confetti, 'display', 'none');

      const sa = p.sparkleAge;
      if (sa >= 0 && sa < 0.55) {
        put(E.sparkle, 'display', 'inline');
        const k = sa / 0.55;
        put(E.sparkle, 'transform', `translate(14 -60) scale(${f2(Math.sin(k * Math.PI) * 1.2)}) rotate(${f2(k * 90)})`);
      } else put(E.sparkle, 'display', 'none');
    },
  }));

  const p = initialPose;
  const W = 96 * baseScale;
  const H = 110 * baseScale;
  return (
    <div
      ref={root}
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, willChange: 'transform', contain: 'layout style' }}
      aria-hidden={title ? undefined : true}
    >
      <svg
        width={W}
        height={H}
        viewBox="-48 -100 96 110"
        style={{ position: 'absolute', left: -W / 2, top: -(100 / 110) * H, overflow: 'visible' }}
        role={title ? 'img' : undefined}
        aria-label={title}
        focusable="false"
      >
        <g ref={set('scale')}>
          <ellipse ref={set('shadow')} cx="0" cy="0.6" rx="11" ry="2.2" fill="#000" opacity="0.38" />
          <g ref={set('body')} transform="scale(1 1)">
            <g stroke={C.limb} strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path ref={set('legB')} d={limbPath(p.legs[1])} opacity="0.75" />
              <path ref={set('footB')} d={`M${p.legs[1].c.x - 0.6} 0h3.2`} strokeWidth="2.8" opacity="0.75" />
              <path ref={set('armB')} d={armPath(p.arms[0])} strokeWidth="2.1" opacity="0.75" />
              <circle ref={set('handB')} r="1.3" fill={C.limb} stroke="none" opacity="0.75" cx={p.arms[0].c.x} cy={p.arms[0].c.y} />
              <path ref={set('legF')} d={limbPath(p.legs[0])} />
              <path ref={set('footF')} d={`M${p.legs[0].c.x - 0.6} 0h3.2`} strokeWidth="2.8" />
            </g>
            <g ref={set('torso')} transform={`translate(0 ${p.hipY})`}>
              <rect x="-15" y="-36" width="30" height="36" rx="7" fill={C.body} />
              <path d="M-15 -7 h30 v0 a7 7 0 0 1 -7 7 h-16 a7 7 0 0 1 -7 -7z" fill={C.shade} />
              <rect x="-11.5" y="-33.5" width="5" height="1.6" rx="0.8" fill="#fff" opacity="0.45" />
              <g ref={set('face')}>
                <rect x="-11.5" y="-30.5" width="23" height="18" rx="4.2" fill={C.plate} />
                <g ref={set('eyes')}>
                  <g ref={set('eyesRect')} fill={C.eye}>
                    <rect ref={set('eyeL')} x="-6.8" y="-24.3" width="3.6" height="5.6" rx="1.1" />
                    <rect ref={set('eyeR')} x="3.2" y="-24.3" width="3.6" height="5.6" rx="1.1" />
                  </g>
                  <g ref={set('eyesHappy')} display="none" stroke={C.eye} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M-7.3 -20.3 L-5 -23 L-2.7 -20.3" />
                    <path d="M2.7 -20.3 L5 -23 L7.3 -20.3" />
                  </g>
                  <g ref={set('eyesWince')} display="none" stroke={C.eye} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M-7 -23.5 L-3.6 -21.5 L-7 -19.5" />
                    <path d="M7 -23.5 L3.6 -21.5 L7 -19.5" />
                  </g>
                  <g ref={set('eyePulse')}>
                    <g ref={set('eyesStar')} display="none" fill={C.gold}>
                      <path d="M-5 -25.6 L-3.9 -22.6 L-0.8 -22.4 L-3.3 -20.5 L-2.4 -17.5 L-5 -19.3 L-7.6 -17.5 L-6.7 -20.5 L-9.2 -22.4 L-6.1 -22.6 Z" />
                      <path d="M5 -25.6 L6.1 -22.6 L9.2 -22.4 L6.7 -20.5 L7.6 -17.5 L5 -19.3 L2.4 -17.5 L3.3 -20.5 L0.8 -22.4 L3.9 -22.6 Z" />
                    </g>
                    <g ref={set('eyesHeart')} display="none" fill={C.pink}>
                      <path d="M-5 -18.4 C-8.6 -20.6 -9 -23.4 -7.3 -24.4 C-6.2 -25 -5.2 -24.4 -5 -23.4 C-4.8 -24.4 -3.8 -25 -2.7 -24.4 C-1 -23.4 -1.4 -20.6 -5 -18.4 Z" />
                      <path d="M5 -18.4 C1.4 -20.6 1 -23.4 2.7 -24.4 C3.8 -25 4.8 -24.4 5 -23.4 C5.2 -24.4 6.2 -25 7.3 -24.4 C9 -23.4 8.6 -20.6 5 -18.4 Z" />
                    </g>
                  </g>
                  <g ref={set('eyesWink')} display="none">
                    <path d="M-7.4 -21.2 Q-5 -23.6 -2.6 -21.2" stroke={C.eye} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <rect x="3.2" y="-24.3" width="3.6" height="5.6" rx="1.1" fill={C.eye} />
                  </g>
                  <g ref={set('eyesClosed')} display="none" stroke={C.eye} strokeWidth="1.4" strokeLinecap="round" fill="none">
                    <path d="M-7.4 -21.6 Q-5 -19.6 -2.6 -21.6" />
                    <path d="M2.6 -21.6 Q5 -19.6 7.4 -21.6" />
                  </g>
                </g>
                <g ref={set('cheeks')} display="none" fill={C.pink} opacity="0.55">
                  <ellipse cx="-8.2" cy="-17" rx="2.1" ry="1.2" />
                  <ellipse cx="8.2" cy="-17" rx="2.1" ry="1.2" />
                </g>
                <g ref={set('mouthG')} fill={C.eye} stroke={C.eye}>
                  <path ref={set('mSmile')} d="M-2.2 -16.9 Q0 -15.1 2.2 -16.9" fill="none" strokeWidth="1.2" strokeLinecap="round" />
                  <path ref={set('mGrin')} display="none" d="M-3 -17.3 Q0 -13.4 3 -17.3 Z" strokeWidth="0.6" strokeLinejoin="round" />
                  <rect ref={set('mO')} display="none" x="-1.1" y="-17.6" width="2.2" height="2.4" rx="1.1" stroke="none" />
                  <path ref={set('mFlat')} display="none" d="M-1.8 -16.4 h3.6" strokeWidth="1.1" strokeLinecap="round" />
                  <rect ref={set('mTalk')} display="none" x="-1.8" y="-17" width="3.6" height="1.4" rx="0.7" stroke="none" />
                  <g ref={set('mDots')} display="none" stroke="none">
                    <circle ref={set('dot0')} cx="-2.6" cy="-16.4" r="0.85" />
                    <circle ref={set('dot1')} cx="0" cy="-16.4" r="0.85" />
                    <circle ref={set('dot2')} cx="2.6" cy="-16.4" r="0.85" />
                  </g>
                </g>
                <rect ref={set('prompt')} x="-9.6" y="-15.2" width="2.6" height="1" fill={C.eye} opacity="0" />
                <g ref={set('c-glasses')} display="none" fill="none" stroke={C.white} strokeWidth="0.9">
                  <circle cx="-5" cy="-21.5" r="4.3" />
                  <circle cx="5" cy="-21.5" r="4.3" />
                  <path d="M-0.7 -22 h1.4" />
                </g>
              </g>
              {/* costumes that sit on the head */}
              <g ref={set('c-agent')} display="none">
                <path d="M6 -36 L9 -45" stroke={C.white} strokeWidth="1.2" strokeLinecap="round" />
                <circle ref={set('antennaTip')} cx="9.3" cy="-46" r="2" fill={C.violet} />
                <rect x="14" y="-27" width="3" height="7" rx="1.5" fill={C.violet} />
              </g>
              <g ref={set('c-helmet')} display="none">
                <path d="M-13.5 -36 C-13.5 -48 13.5 -48 13.5 -36 Z" fill={C.gold} />
                <rect x="-17" y="-37.2" width="34" height="2.6" rx="1.3" fill={C.gold} />
                <path d="M0 -46 v9" stroke="#C99A2E" strokeWidth="1.6" />
              </g>
              <g ref={set('c-party')} display="none">
                <path d="M-6 -36 L1 -52 L8 -36 Z" fill={C.violet} />
                <path d="M-3.2 -42.5 L5.4 -42.5 M-1.2 -47 L3.4 -47" stroke={C.white} strokeWidth="1" />
                <circle cx="1" cy="-52.5" r="2" fill={C.gold} />
              </g>
              <g ref={set('c-cap')} display="none">
                <path d="M-15 -39 L0 -44 L15 -39 L0 -34 Z" fill="#1E2A3B" stroke={C.white} strokeWidth="0.5" />
                <rect x="-7" y="-38" width="14" height="3" fill="#1E2A3B" />
                <path d="M0 -39 L10 -37 L10 -31" stroke={C.gold} strokeWidth="0.9" fill="none" />
                <circle cx="10" cy="-30.6" r="1.1" fill={C.gold} />
              </g>
              <g ref={set('c-crown')} display="none">
                <path d="M-11 -36 L-12.5 -48 L-5.5 -42 L0 -51 L5.5 -42 L12.5 -48 L11 -36 Z" fill={C.gold} stroke="#C99A2E" strokeWidth="0.8" strokeLinejoin="round" />
                <circle cx="0" cy="-41" r="1.6" fill={C.pink} />
                <circle cx="-7" cy="-39.5" r="1.1" fill={C.violet} />
                <circle cx="7" cy="-39.5" r="1.1" fill={C.violet} />
              </g>
              <g ref={set('c-detective')} display="none">
                <path d="M-14 -36 C-14 -47 14 -47 14 -36 Z" fill="#8A6A45" />
                <path d="M-19 -36.5 Q0 -32.5 19 -36.5 Q0 -39.5 -19 -36.5 Z" fill="#6E5235" />
                <path d="M-13.5 -39 h27" stroke="#3B2C1C" strokeWidth="2" />
                <path d="M2 -46 Q6 -50 9 -47" stroke="#6E5235" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </g>
              <g ref={set('c-medic')} display="none">
                <path d="M-12 -36 L-10 -45 Q0 -48 10 -45 L12 -36 Z" fill={C.white} />
                <rect x="-1.4" y="-44.5" width="2.8" height="7.4" rx="0.5" fill="#F06A6A" />
                <rect x="-3.7" y="-42.2" width="7.4" height="2.8" rx="0.5" fill="#F06A6A" />
              </g>
              <g ref={set('c-beanie')} display="none">
                <path d="M-14 -35 C-14 -50 14 -50 14 -35 Z" fill={C.violet} />
                <rect x="-15" y="-38" width="30" height="4.5" rx="2" fill="#8A9AF0" />
                <circle cx="0" cy="-48.5" r="3" fill={C.white} />
              </g>
              <g ref={set('c-headset')} display="none" fill="none" stroke={C.white} strokeWidth="1.4" strokeLinecap="round">
                <path d="M-15.5 -24 C-15.5 -44 15.5 -44 15.5 -24" />
                <rect x="13.5" y="-27" width="4" height="7" rx="2" fill={C.white} />
                <path d="M15.5 -20 Q14 -13 6 -13.5" strokeWidth="1" />
              </g>
            </g>
            <g stroke={C.limb} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path ref={set('armF')} d={armPath(p.arms[1])} />
            </g>
            <circle ref={set('handF')} r="1.5" fill={C.limb} cx={p.arms[1].c.x} cy={p.arms[1].c.y} />
            {/* hand-held tools: drawn along the forearm, aimed at whatever Byte is explaining */}
            <g ref={set('t-wand')} display="none">
              <path d="M0 0 L15 0" stroke="#3B2C1C" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M12.5 0 L15 0" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" />
              <path ref={set('wandStar')} d="M0 -3.4 L1 -1 L3.4 0 L1 1 L0 3.4 L-1 1 L-3.4 0 L-1 -1 Z" fill={C.gold} transform="translate(16 0)" />
            </g>
            <g ref={set('t-pointer')} display="none">
              <path d="M0 0 L19 0" stroke="#9AA6B8" strokeWidth="1.1" strokeLinecap="round" />
              <path d="M0 0 L7 0" stroke="#5B6678" strokeWidth="2" strokeLinecap="round" />
              <circle ref={set('laserDot')} cx="20" cy="0" r="1.5" fill="#FF6B6B" style={{ filter: 'blur(0.4px)' }} />
            </g>
            <g ref={set('t-flag')} display="none">
              <path d="M0 0 L26 0" stroke="#C9D2DE" strokeWidth="1" strokeLinecap="round" />
              <path ref={set('flagCloth')} d="M17 0 Q21 -1.5 25 0 L25 -6 Q21 -7.5 17 -6 Z" fill={C.body} />
            </g>
            <g ref={set('t-magnifier')} display="none">
              <path d="M0 0 L7 0" stroke="#8A6A45" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="0" r="4.8" fill="rgb(169 184 255 / 0.25)" stroke={C.white} strokeWidth="1.2" />
              <path d="M10 -2.2 Q11.5 -3.2 13.4 -2.6" stroke={C.white} strokeWidth="0.7" fill="none" opacity="0.8" />
            </g>
            <g ref={set('t-wrench')} display="none">
              <path d="M0 0 L12 0" stroke="#AEB8C6" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M12 -3.2 A3.6 3.6 0 1 1 12 3.2 L14.4 1.1 L14.4 -1.1 Z" fill="#AEB8C6" />
            </g>
            <g ref={set('t-mug')} display="none">
              <rect x="-3" y="-6.5" width="6" height="6.5" rx="1.2" fill={C.white} />
              <path d="M3 -5 Q5.4 -3.4 3 -1.6" stroke={C.white} strokeWidth="1" fill="none" />
              <rect x="-2.2" y="-5.6" width="4.4" height="1.2" fill="#8A6A45" />
              <path ref={set('steam')} d="M-1 -8 Q-2 -10 -0.6 -12 M1.4 -8 Q0.4 -10.4 1.8 -12.4" stroke={C.white} strokeWidth="0.6" fill="none" opacity="0.5" />
            </g>
            <g ref={set('t-sword')} display="none">
              <path ref={set('swordGlow')} d="M2 -1.9 L21 -1.2 L24.5 0 L21 1.2 L2 1.9 Z" fill={C.body} opacity="0.4" style={{ filter: 'blur(1.2px)' }} />
              <path d="M2.4 -1 L21 -0.7 L23.6 0 L21 0.7 L2.4 1 Z" fill="#E9FFF9" />
              <path d="M2.4 0 L22 0" stroke={C.body} strokeWidth="0.35" />
              <rect x="0.6" y="-3.6" width="1.8" height="7.2" rx="0.9" fill={C.gold} />
              <rect x="-3.4" y="-0.9" width="4.2" height="1.8" rx="0.9" fill="#8A6A45" />
              <circle cx="-3.8" cy="0" r="1.2" fill={C.gold} />
            </g>
            <g ref={set('c-trophy')} display="none">
              <g ref={set('trophy')}>
                <path d="M-3.6 -9 h7.2 v2.5 a3.6 3.6 0 0 1 -7.2 0z" fill={C.gold} />
                <rect x="-0.8" y="-3" width="1.6" height="2.4" fill={C.gold} />
                <rect x="-2.6" y="-0.8" width="5.2" height="1.6" rx="0.6" fill="#C99A2E" />
              </g>
            </g>
          </g>
          {/* props live outside the mirrored body group */}
          <g ref={set('zzz')} display="none" fill={C.white} fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="8">
            <text ref={set('z0')}>z</text>
            <text ref={set('z1')}>z</text>
            <text ref={set('z2')}>z</text>
          </g>
          <g ref={set('thinkG')} display="none">
            <circle cx="15" cy="-56" r="1.4" fill={C.white} opacity="0.7" />
            <circle cx="19" cy="-61" r="2" fill={C.white} opacity="0.8" />
            <rect x="17" y="-77" width="22" height="11" rx="5.5" fill={C.white} />
            <circle ref={set('td0')} cx="23" cy="-71.5" r="1.3" fill={C.plate} />
            <circle ref={set('td1')} cx="28" cy="-71.5" r="1.3" fill={C.plate} />
            <circle ref={set('td2')} cx="33" cy="-71.5" r="1.3" fill={C.plate} />
          </g>
          <g ref={set('confetti')} display="none">
            {CONFETTI.map((c, i) => (
              <rect key={i} ref={set(`cf${i}`)} x="-1.2" y="-0.7" width="2.4" height="1.4" fill={c.c} />
            ))}
          </g>
          <path ref={set('sparkle')} display="none" d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill={C.white} />
        </g>
      </svg>
      {children}
    </div>
  );
}
