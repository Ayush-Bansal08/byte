import type { ArmMode, ByteEngine, Costume, Expression, Mouth } from './engine';
import { clamp, lerp } from './math';

/**
 * Rig units: body 30 × 36, legs 14, origin at the midpoint between the feet.
 * Everything is in "facing right" space; the renderer mirrors the body group.
 */
export const RIG = {
  bodyW: 30,
  bodyH: 36,
  legLen: 14,
  hipX: 6,
  upperArm: 6.5,
  foreArm: 6,
  radius: 7,
} as const;

type P = { x: number; y: number };
export type Limb = { a: P; b: P; c: P };

export type Pose = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  mirror: number; // signed width factor for the body group (-1..1, |v| >= 0.55)
  hipY: number;
  squashX: number;
  squashY: number;
  rotate: number;
  spin: number;
  faceShift: number;
  eyeDX: number;
  eyeDY: number;
  lid: number;
  expression: Expression;
  mouth: Mouth;
  talk: number;
  legs: [Limb, Limb];
  arms: [Limb, Limb]; // [back, front]
  armModeF: ArmMode;
  costume: Costume;
  zzz: boolean;
  tool: string | null;
  /** forearm direction in degrees (facing-right space), for hand-held tools */
  toolAngle: number;
  think: boolean;
  confettiAge: number;
  sparkleAge: number;
  shadow: number;
  time: number;
};

export function computePose(e: ByteEngine, alpha = 1): Pose {
  const scale = e.cfg.scale * e.size.value;
  const x = lerp(e.prevX, e.x, alpha);
  const y = lerp(e.prevY, e.y, alpha);
  const t = e.time;

  const amp = clamp(e.walkAmp, 0, 1.25);
  const phase = e.walkPhase;
  const bob = -2.4 * amp * (1 - Math.abs(Math.cos(phase)));
  const sit = clamp(e.sit.value, 0, 1);
  const crouch = clamp(e.crouch.value, -1.5, 2);
  const breathe = e.state === 'SLEEPING' ? Math.sin(t * 1.5) * 0.025 : Math.sin(t * 2) * 0.012;

  const legExt = clamp(e.legExtend.value, 0, 1.3);
  const hipY = -RIG.legLen * legExt + crouch * 4.5 + sit * 8 + bob;

  const squashY = clamp(e.squash.value + breathe, 0.6, 1.4);
  const squashX = 1 / Math.sqrt(squashY);

  // ---- legs (front = +x)
  const tuck = clamp(e.tuck.value, 0, 1);
  const dangle = e.dangle.value;
  const legs = [0, 1].map((i) => {
    const side = i === 0 ? 1 : -1;
    const ph = phase + (i === 0 ? 0 : Math.PI);
    const hip = { x: side * RIG.hipX * squashX * 0.8, y: hipY };
    let fx = side * 3.2 + amp * 6.2 * Math.cos(ph);
    let fy = -amp * 4.6 * Math.max(0, -Math.sin(ph));
    fx += sit * 5 - tuck * 3 + dangle * 0.12;
    fy -= tuck * (i === 0 ? 6 : 4);
    if (legExt < 1) {
      fx = lerp(hip.x, fx, legExt);
      fy = lerp(hip.y, fy, legExt);
    }
    const foot = { x: fx, y: Math.min(fy, 0) };
    const dx = foot.x - hip.x;
    const dy = foot.y - hip.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const L = RIG.legLen * Math.max(0.2, legExt);
    const bend = Math.sqrt(Math.max(0, L * L - dist * dist)) * 0.55;
    const knee = { x: (hip.x + foot.x) / 2 + bend, y: (hip.y + foot.y) / 2 };
    return { a: hip, b: knee, c: foot };
  }) as [Limb, Limb];

  // ---- arms
  const bodyTop = hipY - RIG.bodyH * squashY;
  const shoulderY = hipY - 19 * squashY;
  const arm = (side: 1 | -1, theta: number, elbow: number): Limb => {
    const s = { x: side * 13.6 * squashX, y: shoulderY };
    const d1 = { x: Math.sin(theta) * side, y: Math.cos(theta) };
    const el = { x: s.x + d1.x * RIG.upperArm, y: s.y + d1.y * RIG.upperArm };
    const th2 = theta + elbow;
    const d2 = { x: Math.sin(th2) * side, y: Math.cos(th2) };
    return { a: s, b: el, c: { x: el.x + d2.x * RIG.foreArm, y: el.y + d2.y * RIG.foreArm } };
  };
  const arms: [Limb, Limb] = [arm(-1, e.armB.value, e.elbowB.value), arm(1, e.armF.value, e.elbowF.value)];

  const face = e.face.value;
  const mirror = Math.sign(face || 1) * Math.max(0.55, Math.abs(face));

  const talking = e.mouth === 'talk' && t < e.talkUntil;
  const talk = talking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.3)) : 0;

  void bodyTop;

  return {
    x,
    y,
    scale,
    opacity: clamp(e.opacity.value, 0, 1),
    mirror,
    hipY,
    squashX,
    squashY,
    rotate: clamp(e.lean.value, -18, 18),
    spin: e.spin,
    faceShift: 2.6 * Math.abs(face),
    eyeDX: e.eyeX.value * Math.sign(face || 1),
    eyeDY: e.eyeY.value,
    lid: clamp(e.lid.value, 0.04, 1.1),
    expression: e.expression,
    mouth: e.mouth,
    talk,
    legs,
    arms,
    armModeF: e.armModeF,
    costume: e.costume,
    zzz: e.props.zzz,
    tool: e.props.tool,
    toolAngle: (Math.atan2(arms[1].c.y - arms[1].b.y, arms[1].c.x - arms[1].b.x) * 180) / Math.PI,
    think: e.props.think,
    confettiAge: t - e.props.confettiAt,
    sparkleAge: t - e.props.sparkleAt,
    shadow: e.grounded ? 1 : 0,
    time: t,
  };
}

export function limbPath(l: Limb) {
  const f = (n: number) => n.toFixed(1);
  return `M${f(l.a.x)} ${f(l.a.y)}Q${f(l.b.x)} ${f(l.b.y)} ${f(l.c.x)} ${f(l.c.y)}`;
}
export function armPath(l: Limb) {
  const f = (n: number) => n.toFixed(1);
  return `M${f(l.a.x)} ${f(l.a.y)}L${f(l.b.x)} ${f(l.b.y)}L${f(l.c.x)} ${f(l.c.y)}`;
}
