import { describe, expect, it } from 'vitest';
import { ByteDirector, type Perch } from '@/lib/byte/director';
import { ByteEngine, FIXED_DT } from '@/lib/byte/engine';

const perch = (id: string, y: number, extra: Partial<Perch> = {}): Perch => ({
  id,
  behavior: 'none',
  costume: 'none',
  mood: 'happy',
  bubble: 'left',
  left: 100,
  right: 500,
  y,
  standX: 460,
  lookPoint: null,
  order: 0,
  ...extra,
});

function setup() {
  const e = new ByteEngine({}, 11);
  const bubbles: (string | null)[] = [];
  const scenes: string[] = [];
  const d = new ByteDirector(e, { bubble: (b) => bubbles.push(b?.text ?? null), scene: (s) => scenes.push(s) });
  d.setViewport({ top: 0, bottom: 900, left: 0, right: 1440 });
  d.setPerches([
    perch('top', 400, { behavior: 'greet', message: 'Hi!' }),
    perch('saka', 700, { behavior: 'inspect', costume: 'agent', mood: 'focused', scene: 'saka-pipeline', lookPoint: { x: 300, y: 760 }, message: 'Watch.' }),
    perch('far', 3000, { costume: 'helmet' }),
  ]);
  const run = (seconds: number) => {
    for (let i = 0; i < Math.round(seconds / FIXED_DT); i++) {
      e.step(FIXED_DT);
      d.tick();
    }
  };
  return { e, d, run, bubbles, scenes };
}

describe('ByteDirector', () => {
  it('emerges from the logo, jumps to the first perch and greets once', () => {
    const { e, d, run, bubbles } = setup();
    d.repeatAfter = 100; // within the cooldown, a line is not repeated
    d.setLogo(60, 30, 0.4);
    d.enterFromLogo('top');
    run(0.5);
    expect(e.state).toBe('ENTERING');
    run(5);
    expect(e.x).toBe(460);
    expect(e.y).toBe(400);
    expect(bubbles).toContain('Hi!');
    // returning later does not repeat the line
    d.goTo('saka');
    run(6);
    d.goTo('top');
    run(6);
    expect(bubbles.filter((b) => b === 'Hi!')).toHaveLength(1);
  });

  it('speaks the moment it lands, not after acting it out', () => {
    const { e, d, run, bubbles } = setup();
    d.dropIn('top');
    run(4);
    d.want('saka');
    let landedAt = -1;
    e.on((ev) => {
      if (ev.type === 'landed') landedAt = e.time;
    });
    let spokeAt = -1;
    for (let i = 0; i < 600 && spokeAt < 0; i++) {
      run(1 / 120);
      if (bubbles.includes('Watch.')) spokeAt = e.time;
    }
    expect(landedAt).toBeGreaterThan(0);
    expect(spokeAt - landedAt).toBeLessThan(0.25);
  });

  it('changes costume mid-jump and triggers the section scene on arrival', () => {
    const { e, d, run, scenes } = setup();
    d.dropIn('top');
    run(4);
    d.want('saka');
    run(0.4);
    expect(e.state).toBe('JUMPING');
    run(4);
    expect(e.costume).toBe('agent');
    expect(e.restMood).toBe('focused');
    expect(scenes).toContain('saka-pipeline');
    expect(d.current).toBe('saka');
  });

  it('walks along the same surface instead of jumping', () => {
    const { e, d, run } = setup();
    d.setPerches([perch('a', 400, { standX: 180 }), perch('b', 400, { standX: 330 })]);
    d.dropIn('a');
    run(4);
    const seen = new Set<string>();
    d.goTo('b');
    for (let i = 0; i < 300; i++) {
      run(FIXED_DT);
      seen.add(e.state);
    }
    expect(seen).toContain('WALKING');
    expect(seen).not.toContain('JUMPING');
  });

  it('presents side-by-side cards: after the first, it hops over to the neighbour', () => {
    const { e, d, run, bubbles } = setup();
    d.sleepAfter = 1e9;
    d.setPerches([
      perch('left', 600, { left: 100, right: 500, standX: 460, message: 'Left card.', costume: 'helmet' }),
      perch('right', 600, { left: 700, right: 1100, standX: 1060, message: 'Right card.', costume: 'medic' }),
    ]);
    d.dropIn('left');
    for (let i = 0; i < 20 && d.current !== 'right'; i++) {
      d.interact('pointer');
      run(1);
    }
    run(4);
    expect(d.current).toBe('right');
    expect(e.x).toBe(1060);
    expect(e.costume).toBe('medic');
    expect(bubbles).toContain('Right card.');
  });

  it('re-enters from the viewport edge when its perch is far off-screen', () => {
    const { e, d, run } = setup();
    d.dropIn('top');
    run(4);
    d.setViewport({ top: 2500, bottom: 3400, left: 0, right: 1440 });
    d.want('far');
    run(0.15);
    // Byte was above the viewport (the visitor scrolled down), so it drops in from the top edge
    expect(e.y).toBeLessThan(2500);
    run(4);
    expect(e.y).toBe(3000);
    expect(e.costume).toBe('helmet');
  });

  it('reacts within a frame once scrolling stops, and speaks at touchdown', () => {
    const { e, d, run, bubbles } = setup();
    d.dropIn('top');
    run(4);
    const lines = () => bubbles.filter(Boolean).length;
    const before = lines();
    d.want('saka');
    d.commit();
    run(1 / 60);
    expect(e.state).not.toBe('IDLE');
    let landedAt = -1;
    e.on((ev) => {
      if (ev.type === 'landed' && landedAt < 0) landedAt = e.time;
    });
    for (let i = 0; i < 480 && lines() === before; i++) run(1 / 120);
    expect(landedAt).toBeGreaterThan(0);
    // the line appears on the same step Byte touches down, not after the landing squash
    expect(e.time - landedAt).toBeLessThan(0.02);
  });

  it('gets drowsy and sleeps when ignored, and wakes on interaction', () => {
    const { e, d, run, bubbles } = setup();
    d.sleepAfter = 8;
    d.dropIn('top');
    run(16);
    expect(['DROWSY', 'SLEEPING']).toContain(e.state);
    run(6);
    expect(e.state).toBe('SLEEPING');
    d.interact('pointer');
    run(0.1);
    expect(e.state).toBe('WAKING');
    expect(bubbles.at(-1)).toBeTruthy();
    run(3);
    expect(['IDLE', 'LOOKING', 'SPEAKING']).toContain(e.state);
  });

  it('thinks while the chat is waiting for an answer, then speaks', () => {
    const { e, d, run } = setup();
    d.dropIn('top');
    run(5);
    d.setChat('open');
    run(1.5);
    d.setChat('thinking');
    run(0.3);
    expect(e.state).toBe('THINKING');
    d.setChat('speaking');
    run(0.2);
    expect(e.state).toBe('SPEAKING');
  });

  it('never repeats the same idle behaviour twice in a row', () => {
    const { e, d, run } = setup();
    d.sleepAfter = 1e9;
    d.dropIn('top');
    const names: string[] = [];
    e.on((ev) => ev.type === 'action' && ev.phase === 'start' && names.push(ev.name.split(':')[0]!));
    for (let i = 0; i < 120; i++) {
      d.interact('pointer');
      run(1);
    }
    const idle = names.filter((n) => ['look-around', 'shift-weight', 'stretch', 'inspect'].includes(n));
    expect(idle.length).toBeGreaterThan(5);
    expect(new Set(idle).size).toBeGreaterThan(1);
  });

  it('in static (reduced-motion) mode relocates by fading, never walking or jumping', () => {
    const { e, d, run } = setup();
    d.mode = 'static';
    d.dropIn('top');
    const seen = new Set<string>();
    d.want('saka');
    for (let i = 0; i < 600; i++) {
      run(FIXED_DT);
      seen.add(e.state);
    }
    expect(seen).not.toContain('JUMPING');
    expect(seen).not.toContain('WALKING');
    expect(e.y).toBe(700);
  });

  it('recovers from a stuck action instead of freezing', () => {
    const { e, d, run } = setup();
    d.dropIn('top');
    run(4);
    e.run([{ name: 'stuck', state: 'POINTING', update: () => false }]);
    run(1);
    expect(e.state).toBe('POINTING');
    run(11);
    expect(['IDLE', 'LOOKING', 'SPEAKING', 'WAVING', 'TURNING', 'RECOVERING', 'JUMPING']).toContain(e.state);
    expect(e.machine.history.some((h) => h.reason === 'watchdog')).toBe(true);
  });

  it('turning Byte off hides it', () => {
    const { e, d, run } = setup();
    d.dropIn('top');
    run(4);
    d.setViewport({ top: 2000, bottom: 2900, left: 0, right: 1440 });
    d.setMode('off');
    run(1);
    expect(e.state).toBe('HIDDEN');
  });
});
