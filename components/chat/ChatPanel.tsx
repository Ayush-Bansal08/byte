'use client';

import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useByte } from '@/components/byte/ByteContext';
import { useTransitionNav } from '@/components/transition/TransitionProvider';
import { PROJECT_BY_SLUG } from '@/content/projects';
import type { AskResponse } from '@/lib/ai/schema';
import { celebrate, think, wave } from '@/lib/byte/engine';

type Msg = { role: 'user' | 'byte'; text: string; res?: AskResponse; error?: boolean };

const SECTIONS = ['achievements', 'work', 'experience', 'skills', 'about', 'contact'];
const SECTION_LABELS: Record<string, string> = {
  top: 'Home',
  achievements: 'Recognition',
  work: 'Selected work',
  experience: 'Experience',
  skills: 'Skills',
  about: 'About',
  contact: 'Contact',
};

function suggestionsFor(project?: string): string[] {
  if (project) {
    const name = PROJECT_BY_SLUG[project]?.name ?? 'this';
    return ['How does this work?', `What was his role in ${name}?`, 'What were the hardest trade-offs?'];
  }
  return ['Who is Ayush?', 'How does SAKA work?', 'What did he do at UNSW?', 'Does he know Kubernetes?', 'How can I contact him?'];
}

export function ChatPanel() {
  const { closeChat, setChatState, directorRef, chatPrefill, consumePrefill, reducedMotion } = useByte();
  const pathname = usePathname();
  const router = useRouter();
  const transition = useTransitionNav();
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<{ mode: 'ai' | 'offline'; provider: string | null } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const pathProject = pathname.startsWith('/work/') ? pathname.split('/')[2] : undefined;
  const [perchProject, setPerchProject] = useState<string | undefined>(undefined);
  const project = pathProject ?? perchProject;
  const currentSection = () => {
    const cur = directorRef.current?.current ?? '';
    return SECTIONS.includes(cur) ? cur : undefined;
  };
  useEffect(() => {
    const cur = directorRef.current?.current ?? undefined;
    if (cur && PROJECT_BY_SLUG[cur]) setPerchProject(cur);
  }, [directorRef]);

  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setChatState('open');
    inputRef.current?.focus();
    fetch('/api/ask')
      .then((r) => r.json())
      .then(setMode)
      .catch(() => setMode({ mode: 'offline', provider: null }));
    return () => {
      setChatState('closed');
      returnFocus.current?.focus?.();
    };
  }, [setChatState]);

  useEffect(() => {
    if (chatPrefill) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot prefill from a CTA
      setInput(chatPrefill);
      consumePrefill();
    }
  }, [chatPrefill, consumePrefill]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [msgs, pending, reducedMotion]);

  const close = () => setOpen(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function ask(question: string) {
    const q = question.trim().slice(0, 500);
    if (!q || pending) return;
    const history = msgs.slice(-6).map((m) => ({ role: m.role, text: m.text.slice(0, 900) }));
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setPending(true);
    setChatState('thinking');
    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, history, context: { path: pathname, project, section: currentSection() } }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsgs((m) => [...m, { role: 'byte', text: body.error ?? 'Something went wrong. Please try again.', error: true }]);
        setChatState('unknown');
        return;
      }
      const res = body as AskResponse;
      setMsgs((m) => [...m, { role: 'byte', text: res.answer, res }]);
      setChatState(res.found ? 'speaking' : 'unknown');
      const e = directorRef.current?.engine;
      if (e && res.action?.type === 'emote') {
        if (res.action.name === 'celebrate') e.run([celebrate()], { append: true });
        if (res.action.name === 'wave') e.run([wave(1)], { append: true });
        if (res.action.name === 'think') e.run([think(1)], { append: true });
      }
    } catch {
      setMsgs((m) => [...m, { role: 'byte', text: 'I couldn’t reach the server. Check your connection and try again.', error: true }]);
      setChatState('unknown');
    } finally {
      setPending(false);
    }
  }

  /** "Show me": close the chat, then Byte pulls the curtain across to the destination. */
  function go(target: string) {
    const project = PROJECT_BY_SLUG[target];
    const href = project ? `/work/${target}` : target === 'top' ? '/' : `/#${target}`;
    const label = project?.name ?? SECTION_LABELS[target] ?? 'Home';
    close();
    // let the panel start its exit so the curtain sweeps over a calm page
    window.setTimeout(() => (transition ? transition.navigate(href, label) : router.push(href)), reducedMotion ? 0 : 140);
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  const greeting = project
    ? `You’re looking at ${PROJECT_BY_SLUG[project]?.name}. Ask me how it works, or what Ayush did on it.`
    : 'Hi! I’m Byte. Ask me anything about Ayush’s work. I answer from his verified résumé and repositories, and I’ll show you the evidence.';

  return (
    <AnimatePresence onExitComplete={closeChat}>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          data-testid="chat-panel"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.8 }}
          style={{ transformOrigin: 'bottom right' }}
          className="fixed inset-x-2 bottom-2 z-[70] flex max-h-[82dvh] flex-col overflow-hidden rounded-3xl border border-line-strong bg-surface-2 shadow-[0_24px_64px_-16px_rgb(0_0_0/0.75)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[390px] sm:max-h-[min(640px,80dvh)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="relative inline-flex h-7 w-6 items-center justify-center rounded-[6px] bg-accent">
                <span className="absolute inset-x-[3px] top-[5px] flex h-[11px] items-center justify-center gap-[3px] rounded-[3px] bg-[#0b141d]">
                  <span className={`h-[5px] w-[2px] rounded-[1px] bg-[#b6f5e6] ${pending ? 'animate-pulse' : ''}`} />
                  <span className={`h-[5px] w-[2px] rounded-[1px] bg-[#b6f5e6] ${pending ? 'animate-pulse' : ''}`} />
                </span>
              </span>
              <div className="leading-tight">
                <h2 id={titleId} className="text-[0.95rem] font-semibold tracking-normal">
                  Ask Byte
                </h2>
                <p className="font-mono text-[0.68rem] text-faint" data-testid="chat-mode">
                  {mode === null ? 'connecting…' : mode.mode === 'ai' ? `AI answers · grounded in verified sources` : 'Offline mode · curated answers, no AI model'}
                </p>
              </div>
            </div>
            <button type="button" onClick={close} className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-text" aria-label="Close chat">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions" data-testid="chat-log">
            <Bubble role="byte">{greeting}</Bubble>
            {msgs.map((m, i) => (
              <Bubble key={i} role={m.role} error={m.error}>
                {m.text}
                {m.res && (
                  <>
                    {m.res.citations.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1.5" data-testid="citations">
                        {m.res.citations.map((c) => (
                          <a
                            key={c.id}
                            href={c.url}
                            target={c.url.startsWith('http') ? '_blank' : undefined}
                            rel="noreferrer"
                            className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.68rem] text-muted transition-colors hover:border-accent hover:text-accent"
                          >
                            {c.title}
                          </a>
                        ))}
                      </span>
                    )}
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      {m.res.action?.type === 'goto' && (
                        <button type="button" onClick={() => go((m.res!.action as { target: string }).target)} className="rounded-full bg-accent/15 px-2.5 py-1 text-[0.78rem] text-accent hover:bg-accent/25">
                          Show me →
                        </button>
                      )}
                      <span className="font-mono text-[0.64rem] text-faint">
                        {m.res.mode === 'ai' ? `AI answer (${m.res.provider === 'gemini' ? 'Gemini' : 'Claude'})` : mode?.mode === 'ai' && !m.res.fallbackReason ? 'Verified answer · instant' : 'Curated answer (offline)'}
                      </span>
                    </span>
                    {m.res.notice && <span className="mt-1 block text-[0.72rem] text-faint">{m.res.notice}</span>}
                  </>
                )}
              </Bubble>
            ))}
            {pending && (
              <Bubble role="byte">
                <span className="inline-flex gap-1" aria-label="Byte is thinking">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              </Bubble>
            )}
          </div>

          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {suggestionsFor(project).map((s) => (
                <button key={s} type="button" onClick={() => void ask(s)} className="rounded-full border border-line-strong px-3 py-1.5 text-[0.8rem] text-muted transition-colors hover:border-accent hover:text-text">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-line p-3">
            <label htmlFor={`${titleId}-q`} className="sr-only">
              Your question
            </label>
            <textarea
              id={`${titleId}-q`}
              ref={inputRef}
              rows={1}
              maxLength={500}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void ask(input);
                }
              }}
              placeholder="Ask about projects, experience…"
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-line-strong bg-bg px-3.5 py-2.5 text-[0.92rem] text-text placeholder:text-faint focus:border-accent focus:outline-none"
              data-testid="chat-input"
            />
            <button type="submit" disabled={pending || !input.trim()} className="btn btn-primary min-h-[44px] px-4 disabled:opacity-40" data-testid="chat-send">
              Ask
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Bubble({ role, error, children }: { role: 'user' | 'byte'; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed ${
          role === 'user' ? 'rounded-br-md bg-accent text-[#08110f]' : error ? 'rounded-bl-md border border-danger/40 bg-bg text-text' : 'rounded-bl-md bg-bg text-text'
        }`}
        data-role={role}
      >
        {children}
      </div>
    </div>
  );
}
