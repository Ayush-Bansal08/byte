'use client';

import dynamic from 'next/dynamic';

// Byte's runtime loads after hydration so it never competes with the page becoming interactive.
export const ByteLayerLazy = dynamic(() => import('./ByteLayer').then((m) => m.ByteLayer), { ssr: false });
