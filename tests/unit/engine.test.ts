import { describe, expect, it } from 'vitest';
import { ByteEngine, FIXED_DT, celebrate, doze, jumpTo, turn, wake, walkTo, wave } from '@/lib/byte/engine';
import { computePose } from '@/lib/byte/rig';

function sim(e: ByteEngine, seconds: number, each?: (e: ByteEngine) => void) {
  const n = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < n; i++) {
    e.step(FIXED_DT);
    each?.(e);
  }
}
function fresh() {
  const e = new ByteEngine({}, 3);
  e.machine.reset('IDLE');
  e.place(100, 500);
  return e;
}

describe('walking', () => {
  it('reaches the target exactly without overshooting and settles to IDLE', () => {
    const e = fresh();
    let maxX = 0;
    e.run([walkTo(400)]);
    sim(e, 4, (en) => (maxX = Math.max(maxX, en.x)));
    expect(e.x).toBe(400);
    expect(maxX).toBeLessThanOrEqual(400.0001);
    expect(e.state).toBe('IDLE');
    expect(e.vx).toBe(0);
  });

  it('accelerates and decelerates instead of moving at constant speed', () => {
    const e = fresh();
    const speeds: number[] = [];
    e.run([walkTo(600)]);
    sim(e, 4, (en) => speeds.push(Math.abs(en.vx)));
    const peak = Math.max(...speeds);
    expect(speeds[2]!).toBeLessThan(peak * 0.2);
    expect(peak).toBeLessThanOrEqual(e.cfg.walkSpeed + 1e-6);
  });

  it('drives the leg cycle from distance travelled, so feet do not slide', () => {
    const e = fresh();
    const start = e.walkPhase;
    e.run([walkTo(100 + e.cfg.stride * 10)]);
    sim(e, 3);
    // half a cycle (pi) per stride length travelled, give or take the final settle
    const halfCycles = (e.walkPhase - start) / Math.PI;
    expect(halfCycles).toBeGreaterThan(9);
    expect(halfCycles).toBeLessThan(11.5);
  });

  it('turns to face the walking direction', () => {
    const e = fresh();
    e.run([turn(-1), walkTo(20)]);
    sim(e, 2);
    expect(e.facing).toBe(-1);
    expect(e.face.value).toBeLessThan(-0.9);
  });
});

describe('jumping', () => {
  it('anticipates with a squash, flies, and lands exactly on target', () => {
    const e = fresh();
    let minSquash = 1;
    let minY = Infinity;
    const states = new Set<string>();
    e.run([jumpTo(300, 380, { apex: 60 })]);
    sim(e, 2, (en) => {
      minSquash = Math.min(minSquash, en.squash.value);
      minY = Math.min(minY, en.y);
      states.add(en.state);
    });
    expect(minSquash).toBeLessThan(0.9);
    expect(e.x).toBe(300);
    expect(e.y).toBe(380);
    expect(minY).toBeLessThan(380 - 55);
    expect(minY).toBeGreaterThan(380 - 65);
    for (const s of ['JUMPING', 'LANDING', 'RECOVERING', 'IDLE']) expect(states).toContain(s);
  });

  it('stretches while airborne', () => {
    const e = fresh();
    let maxSquash = 0;
    e.run([jumpTo(100, 200, { apex: 80 })]);
    sim(e, 1.5, (en) => {
      if (!en.grounded) maxSquash = Math.max(maxSquash, en.squash.value);
    });
    expect(maxSquash).toBeGreaterThan(1.05);
  });

  it('front-flips when the outfit changes mid-jump, and lands upright in the new outfit', () => {
    const e = fresh();
    let maxSpin = 0;
    e.run([jumpTo(380, 420, { apex: 80, costumeAtApex: 'crown' })]);
    sim(e, 2, (en) => (maxSpin = Math.max(maxSpin, Math.abs(en.spin))));
    expect(maxSpin).toBeGreaterThan(300);
    expect(e.spin).toBe(0);
    expect(e.costume).toBe('crown');
  });

  it('cannot be interrupted mid-air: a new plan waits for landing', () => {
    const e = fresh();
    e.run([jumpTo(300, 500, { apex: 80 })]);
    sim(e, 0.3);
    expect(e.grounded).toBe(false);
    e.run([wave(0.5)]);
    sim(e, 0.05);
    expect(e.state).toBe('JUMPING');
    sim(e, 2);
    expect(e.x).toBe(300);
  });
});

describe('expressions and idle', () => {
  it('blinks on its own within a few seconds', () => {
    const e = fresh();
    let closed = false;
    sim(e, 7, (en) => {
      if (en.lid.value < 0.3) closed = true;
    });
    expect(closed).toBe(true);
  });

  it('dozes into SLEEPING, and wake() restores IDLE', () => {
    const e = fresh();
    e.run([doze()]);
    sim(e, 6);
    expect(e.state).toBe('SLEEPING');
    expect(e.props.zzz).toBe(true);
    e.run([wake()]);
    sim(e, 2);
    expect(e.state).toBe('IDLE');
    expect(e.props.zzz).toBe(false);
  });

  it('rejects actions that are illegal from the current state', () => {
    const e = fresh();
    e.run([doze()]);
    sim(e, 6);
    e.run([walkTo(500)]); // walking is not legal from SLEEPING
    sim(e, 1);
    expect(e.rejected).toBeGreaterThan(0);
    expect(e.x).toBe(100);
  });

  it('celebrates with confetti and returns to IDLE', () => {
    const e = fresh();
    e.run([celebrate()]);
    sim(e, 0.2);
    expect(e.state).toBe('CELEBRATING');
    expect(e.props.confettiAt).toBeGreaterThanOrEqual(0);
    sim(e, 2);
    expect(e.state).toBe('IDLE');
  });

  it('produces a finite pose for every frame of a jump', () => {
    const e = fresh();
    e.run([jumpTo(260, 420)]);
    sim(e, 1.2, (en) => {
      const p = computePose(en, 0.5);
      for (const v of [p.x, p.y, p.hipY, p.squashX, p.legs[0].c.x, p.arms[1].c.y]) expect(Number.isFinite(v)).toBe(true);
    });
  });
});
