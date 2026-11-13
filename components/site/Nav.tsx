'use client';

import { useEffect, useRef, useState } from 'react';
import { sound } from '@/lib/byte/sound';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { useByte } from '@/components/byte/ByteContext';

const LINKS = [
  { href: '/#work', label: 'Work' },
  { href: '/#experience', label: 'Experience' },
  { href: '/#about', label: 'About' },
  { href: '/resume', label: 'Résumé', page: 'Résumé' },
  { href: '/#contact', label: 'Contact' },
];

export function Logo() {
  return (
    <TransitionLink href="/" label="Home" className="group inline-flex items-center whitespace-nowrap rounded-md py-2 text-[1.02rem] font-semibold tracking-tight text-text" aria-label="Ayush Bansal, home">
      <span>Ayush Bansal</span>
      <span data-byte-logo className="logo-cursor" aria-hidden="true" />
    </TransitionLink>
  );
}

export function Nav() {
  const { enabled, setEnabled, openChat } = useByte();
  const menu = useRef<HTMLDetailsElement>(null);
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    const s = sound();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the stored preference after hydration
    setSoundOn(!s.muted);
    return s.subscribe(setSoundOn);
  }, []);
  const close = () => menu.current?.removeAttribute('open');
  return (
    <header className="fixed inset-x-0 top-0 z-40 print:hidden border-b border-line bg-bg/92 backdrop-blur-[2px]">
      <nav aria-label="Primary" className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <TransitionLink
                href={l.href}
                label={l.page}
                className="rounded-full px-3 py-2 text-[0.92rem] text-muted transition-colors duration-150 hover:text-text"
              >
                {l.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChat()}
            className="btn min-h-[38px] px-3.5 text-[0.88rem]"
            aria-haspopup="dialog"
            data-testid="ask-byte"
          >
            <span aria-hidden="true" className="inline-block h-[0.9em] w-[0.45em] rounded-[2px] bg-accent" />
            Ask Byte
          </button>
          <button
            type="button"
            aria-pressed={soundOn}
            onClick={() => sound().setMuted(soundOn)}
            className="flex size-[38px] items-center justify-center rounded-full text-faint transition-colors hover:text-text"
            title={soundOn ? 'Mute Byte' : 'Unmute Byte'}
            aria-label={soundOn ? 'Mute Byte’s sound effects' : 'Turn on Byte’s sound effects'}
            data-testid="sound-toggle"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h2.5L9 4v10l-3.5-3H3z" fill="currentColor" stroke="none" />
              {soundOn ? <path d="M12 6.5a3.5 3.5 0 0 1 0 5M14 4.5a6.5 6.5 0 0 1 0 9" /> : <path d="M12 7l4 4M16 7l-4 4" />}
            </svg>
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className="hidden min-h-[38px] items-center gap-2 rounded-full px-2 text-[0.8rem] text-faint transition-colors hover:text-text sm:inline-flex"
            title={enabled ? 'Send Byte back into the logo' : 'Let Byte out'}
            data-testid="byte-toggle"
          >
            <span className={`relative h-[18px] w-[30px] rounded-full border transition-colors ${enabled ? 'border-accent/60 bg-accent/20' : 'border-line-strong'}`}>
              <span className={`absolute top-[2px] size-3 rounded-full transition-transform duration-200 ${enabled ? 'translate-x-[13px] bg-accent' : 'translate-x-[2px] bg-faint'}`} />
            </span>
            <span>Byte</span>
          </button>
          <details ref={menu} className="group relative lg:hidden">
            <summary
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-line-strong [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
              data-testid="menu-button"
            >
              <span aria-hidden="true" className="flex flex-col gap-[5px]">
                <span className="block h-[1.5px] w-4 bg-text transition-transform duration-200 group-open:translate-y-[3.25px] group-open:rotate-45" />
                <span className="block h-[1.5px] w-4 bg-text transition-transform duration-200 group-open:-translate-y-[3.25px] group-open:-rotate-45" />
              </span>
            </summary>
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-line-strong bg-surface p-2 shadow-2xl" style={{ animation: 'rise-in 180ms var(--ease-out)' }}>
              <ul>
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <TransitionLink href={l.href} label={l.page} onClick={close} className="block rounded-xl px-3 py-2.5 text-text hover:bg-bg-2">
                      {l.label}
                    </TransitionLink>
                  </li>
                ))}
                <li className="mt-1 border-t border-line pt-1">
                  <button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-muted hover:bg-bg-2">
                    Byte {enabled ? 'on' : 'off'}
                    <span className={`size-2.5 rounded-full ${enabled ? 'bg-accent' : 'bg-faint'}`} />
                  </button>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
