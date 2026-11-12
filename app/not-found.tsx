import { CharacterStage } from '@/components/byte/CharacterStage';
import { TransitionLink } from '@/components/transition/TransitionLink';

export default function NotFound() {
  return (
    <section className="container-page py-28">
      <div className="flex items-end gap-4">
        <div className="min-w-0">
          <p className="kicker">404</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">This page doesn’t exist.</h1>
        </div>
        <CharacterStage id="not-found" behavior="think" costume="detective" mood="neutral" message="I looked everywhere. Even in /dev/null." className="h-[118px] min-w-[84px] flex-1" />
      </div>
      <p className="mt-4 text-muted">The link may be old, or mistyped.</p>
      <TransitionLink href="/" label="Home" className="btn btn-primary mt-8">
        Back home
      </TransitionLink>
    </section>
  );
}
