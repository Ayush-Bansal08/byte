import type { Costume, Mood } from '@/lib/byte/engine';
import type { Behavior, BubbleChoice } from '@/lib/byte/director';

/**
 * Declares a place Byte can stand. Renders an empty, aria-hidden box that reserves
 * real layout space; Byte stands on its bottom edge and may walk its full width.
 * Works as a server component: everything is plain data attributes.
 */
export function CharacterStage({
  id,
  behavior = 'none',
  costume = 'none',
  mood = 'happy',
  message,
  scene,
  lookAt,
  bubble = 'left',
  align = 'right',
  choices,
  className = '',
  order,
}: {
  id: string;
  behavior?: Behavior;
  costume?: Costume;
  /** Byte's resting expression while it stands here */
  mood?: Mood;
  message?: string;
  scene?: string;
  /** element id Byte looks/points at */
  lookAt?: string;
  bubble?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  choices?: BubbleChoice[];
  className?: string;
  order?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`byte-perch ${className}`}
      data-byte-perch={id}
      data-behavior={behavior}
      data-costume={costume}
      data-mood={mood}
      data-message={message}
      data-scene={scene}
      data-look={lookAt}
      data-bubble={bubble}
      data-align={align}
      data-choices={choices ? JSON.stringify(choices) : undefined}
      data-order={order}
    />
  );
}
