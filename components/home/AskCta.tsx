'use client';

import { useByte } from '@/components/byte/ByteContext';

export function AskCta() {
  const { openChat } = useByte();
  return (
    <button type="button" onClick={() => openChat('Does he know Kubernetes?')} className="btn mt-5 self-start" aria-haspopup="dialog">
      Ask Byte about a skill
    </button>
  );
}
