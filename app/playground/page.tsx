import type { Metadata } from 'next';
import { Playground } from '@/components/playground/Playground';

export const metadata: Metadata = {
  title: 'Byte playground',
  description: 'Trigger Byte’s abilities: walking, jumping, costumes, sleep, and a live view of its state machine and physics.',
  alternates: { canonical: '/playground' },
};

export default function PlaygroundPage() {
  return (
    <div className="container-page pb-20 pt-10 sm:pt-14">
      <p className="kicker">Playground</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Meet Byte</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Byte is a small animation system, not a sprite: a deterministic state machine, a fixed-step physics loop, and a hand-built SVG rig, all in TypeScript. Click the floor or a platform, or use the buttons.
      </p>
      <div className="mt-8">
        <Playground />
      </div>
    </div>
  );
}
