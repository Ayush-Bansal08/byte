/**
 * Byte's deterministic state machine. Every behaviour runs inside exactly one
 * state, and only the transitions listed here are legal. Actions that would
 * cause an illegal transition are rejected (and recorded), never half-applied.
 */
export const BYTE_STATES = [
  'HIDDEN',
  'ENTERING',
  'IDLE',
  'LOOKING',
  'WALKING',
  'TURNING',
  'JUMPING',
  'LANDING',
  'RECOVERING',
  'WAVING',
  'POINTING',
  'INSPECTING',
  'THINKING',
  'SPEAKING',
  'CELEBRATING',
  'DROWSY',
  'SLEEPING',
  'WAKING',
  'DRAGGED',
  'EXITING',
  'TRANSITIONING',
] as const;
export type ByteState = (typeof BYTE_STATES)[number];

const EXPRESSIVE: ByteState[] = ['WAVING', 'POINTING', 'INSPECTING', 'THINKING', 'SPEAKING', 'CELEBRATING'];
const LOCOMOTION: ByteState[] = ['WALKING', 'TURNING', 'JUMPING'];
const LEAVE: ByteState[] = ['EXITING', 'TRANSITIONING', 'DRAGGED'];

const GROUNDED_NEXT: ByteState[] = ['IDLE', 'LOOKING', ...LOCOMOTION, ...EXPRESSIVE, ...LEAVE];

export const TRANSITIONS: Record<ByteState, readonly ByteState[]> = {
  HIDDEN: ['ENTERING', 'JUMPING', 'IDLE', 'TRANSITIONING'],
  ENTERING: ['JUMPING', 'IDLE', 'LOOKING', 'WAVING', 'HIDDEN'],
  IDLE: [...GROUNDED_NEXT, 'DROWSY'],
  LOOKING: [...GROUNDED_NEXT, 'DROWSY'],
  WALKING: GROUNDED_NEXT,
  TURNING: GROUNDED_NEXT,
  JUMPING: ['LANDING', 'HIDDEN', 'DRAGGED'],
  LANDING: ['RECOVERING', 'IDLE', 'DRAGGED'],
  RECOVERING: GROUNDED_NEXT,
  WAVING: GROUNDED_NEXT,
  POINTING: GROUNDED_NEXT,
  INSPECTING: GROUNDED_NEXT,
  THINKING: GROUNDED_NEXT,
  SPEAKING: GROUNDED_NEXT,
  CELEBRATING: GROUNDED_NEXT,
  DROWSY: ['SLEEPING', 'WAKING', 'IDLE', 'DRAGGED', 'TRANSITIONING'],
  SLEEPING: ['WAKING', 'DRAGGED', 'TRANSITIONING'],
  WAKING: ['IDLE', 'RECOVERING', 'LOOKING', 'DRAGGED', 'TRANSITIONING', ...EXPRESSIVE, ...LOCOMOTION],
  DRAGGED: ['JUMPING', 'LANDING'],
  EXITING: ['HIDDEN', 'JUMPING'],
  TRANSITIONING: ['HIDDEN', 'IDLE', 'JUMPING', 'ENTERING'],
};

export function canTransition(from: ByteState, to: ByteState): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

export type TransitionRecord = { from: ByteState; to: ByteState; at: number; reason: string; ok: boolean };

export class ByteMachine {
  state: ByteState = 'HIDDEN';
  readonly history: TransitionRecord[] = [];
  private listeners = new Set<(s: ByteState, prev: ByteState) => void>();

  constructor(private now: () => number = () => 0) {}

  to(next: ByteState, reason = ''): boolean {
    const prev = this.state;
    const ok = canTransition(prev, next);
    this.record({ from: prev, to: next, at: this.now(), reason, ok });
    if (!ok) return false;
    if (prev !== next) {
      this.state = next;
      this.listeners.forEach((l) => l(next, prev));
    }
    return true;
  }

  /** Hard reset used only for teardown, disabling Byte, or reduced-motion. */
  reset(next: ByteState, reason = 'reset') {
    const prev = this.state;
    this.record({ from: prev, to: next, at: this.now(), reason, ok: true });
    this.state = next;
    if (prev !== next) this.listeners.forEach((l) => l(next, prev));
  }

  subscribe(fn: (s: ByteState, prev: ByteState) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private record(r: TransitionRecord) {
    this.history.push(r);
    if (this.history.length > 40) this.history.shift();
  }
}
