import type { AnchorHTMLAttributes } from 'react';

/**
 * A plain anchor. A single delegated listener in TransitionProvider turns clicks on
 * internal links into Byte's curtain transition (or a client-side navigation), so
 * dozens of links cost nothing to hydrate and still work without JavaScript.
 */
export function TransitionLink({ href, label, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; label?: string }) {
  return <a href={href} data-transition-label={label} {...rest} />;
}
