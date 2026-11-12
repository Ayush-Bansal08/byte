import type { MetadataRoute } from 'next';
import { PROJECTS } from '@/content/projects';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, priority: 1 },
    ...PROJECTS.map((p) => ({ url: `${SITE}/work/${p.slug}`, priority: 0.8 })),
    { url: `${SITE}/resume`, priority: 0.7 },
    { url: `${SITE}/playground`, priority: 0.3 },
  ];
}
