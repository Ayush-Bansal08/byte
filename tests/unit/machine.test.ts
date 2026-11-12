import { describe, expect, it } from 'vitest';
import { BYTE_STATES, ByteMachine, TRANSITIONS, canTransition } from '@/lib/byte/machine';

describe('ByteMachine', () => {
  it('defines transitions for every state, targeting only known states', () => {
    for (const s of BYTE_STATES) {
      expect(TRANSITIONS[s]).toBeDefined();
      for (const t of TRANSITIONS[s]) expect(BYTE_STATES).toContain(t);
    }
  });

  it('allows the entrance choreography', () => {
    const m = new ByteMachine();
    for (const s of ['ENTERING', 'JUMPING', 'LANDING', 'RECOVERING', 'WAVING', 'SPEAKING', 'IDLE'] as const) expect(m.to(s)).toBe(true);
    expect(m.state).toBe('IDLE');
  });

  it('rejects illegal moves and records them without changing state', () => {
    const m = new ByteMachine();
    m.reset('SLEEPING');
    expect(m.to('WALKING', 'sleepwalk')).toBe(false);
    expect(m.state).toBe('SLEEPING');
    expect(m.history.at(-1)).toMatchObject({ from: 'SLEEPING', to: 'WALKING', ok: false });
    expect(canTransition('JUMPING', 'WAVING')).toBe(false); // no waving mid-air
    expect(canTransition('IDLE', 'SLEEPING')).toBe(false); // must get drowsy first
    expect(canTransition('DROWSY', 'SLEEPING')).toBe(true);
  });

  it('notifies subscribers once per change and caps history', () => {
    const m = new ByteMachine();
    const seen: string[] = [];
    m.subscribe((s) => seen.push(s));
    m.to('IDLE');
    m.to('IDLE');
    m.to('LOOKING');
    expect(seen).toEqual(['IDLE', 'LOOKING']);
    for (let i = 0; i < 60; i++) m.to(i % 2 ? 'IDLE' : 'LOOKING');
    expect(m.history.length).toBeLessThanOrEqual(40);
  });
});
