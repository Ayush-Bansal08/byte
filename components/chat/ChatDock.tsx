'use client';

import dynamic from 'next/dynamic';
import { useByte } from '@/components/byte/ByteContext';

// The chat (and the motion library it uses) only loads when a visitor opens it.
const ChatPanel = dynamic(() => import('./ChatPanel').then((m) => m.ChatPanel), { ssr: false });

export function ChatDock() {
  const { chatOpen } = useByte();
  return chatOpen ? <ChatPanel /> : null;
}
