import { PROFILE } from '@/content/profile';
import { TransitionLink } from '@/components/transition/TransitionLink';

export function Footer() {
  return (
    <footer className="border-t border-line py-10 print:hidden text-sm text-faint">
      <div className="container-page flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © 2026 {PROFILE.name}. Byte is drawn and animated in code: SVG and TypeScript, no video.{' '}
          <TransitionLink href="/playground" label="Playground" className="link text-muted">
            Play with Byte
          </TransitionLink>
          .
        </p>
        <ul className="flex gap-4">
          <li>
            <a className="link text-muted" href={PROFILE.links.github} rel="noreferrer" target="_blank">
              GitHub
            </a>
          </li>
          <li>
            <a className="link text-muted" href={PROFILE.links.linkedin} rel="noreferrer" target="_blank">
              LinkedIn
            </a>
          </li>
          <li>
            <a className="link text-muted" href={PROFILE.links.email}>
              Email
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
