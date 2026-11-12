'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ByteDirector, ChatState } from '@/lib/byte/director';

type ByteCtx = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  reducedMotion: boolean;
  chatOpen: boolean;
  openChat: (prefill?: string) => void;
  closeChat: () => void;
  chatPrefill: string | null;
  consumePrefill: () => void;
  /** Lets the chat, transitions and playground talk to the live character. */
  directorRef: React.RefObject<ByteDirector | null>;
  setChatState: (s: ChatState) => void;
  emitScene: (scene: string) => void;
  onScene: (fn: (scene: string) => void) => () => void;
};

const Ctx = createContext<ByteCtx | null>(null);
const KEY = 'byte:enabled';

export function ByteProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const [reducedMotion, setReduced] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPrefill, setPrefill] = useState<string | null>(null);
  const directorRef = useRef<ByteDirector | null>(null);
  const sceneListeners = useRef(new Set<(s: string) => void>());

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a stored preference after hydration
      if (localStorage.getItem(KEY) === 'off') setEnabledState(false);
    } catch {
      /* storage unavailable: keep default */
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      localStorage.setItem(KEY, v ? 'on' : 'off');
    } catch {
      /* ignore */
    }
  }, []);

  const openChat = useCallback((prefill?: string) => {
    setPrefill(prefill ?? null);
    setChatOpen(true);
  }, []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const consumePrefill = useCallback(() => setPrefill(null), []);
  const setChatState = useCallback((s: ChatState) => {
    const d = directorRef.current;
    if (!d) return;
    const vw = window.innerWidth;
    d.setChat(s, { x: window.scrollX + vw - 120, y: window.scrollY + window.innerHeight - 160 });
  }, []);
  const emitScene = useCallback((scene: string) => sceneListeners.current.forEach((fn) => fn(scene)), []);
  const onScene = useCallback((fn: (s: string) => void) => {
    sceneListeners.current.add(fn);
    return () => {
      sceneListeners.current.delete(fn);
    };
  }, []);

  const value = useMemo(
    () => ({ enabled, setEnabled, reducedMotion, chatOpen, openChat, closeChat, chatPrefill, consumePrefill, directorRef, setChatState, emitScene, onScene }),
    [enabled, setEnabled, reducedMotion, chatOpen, openChat, closeChat, chatPrefill, consumePrefill, setChatState, emitScene, onScene],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useByte() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useByte must be used inside ByteProvider');
  return c;
}

/** Subscribe a page element to Byte's scene events (e.g. light up a diagram while Byte inspects it). */
export function useScene(scene: string, fn: () => void) {
  const { onScene } = useByte();
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => onScene((s) => s === scene && ref.current()), [onScene, scene]);
}
