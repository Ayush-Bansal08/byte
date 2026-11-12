import { ACHIEVEMENTS, EXPERIENCE, PROFILE } from '@/content/profile';
import { PROJECTS } from '@/content/projects';

export const dynamic = 'force-static';

/** Plain-text summary for language-model crawlers, generated from the same verified content as the site. */
export function GET() {
  const lines = [
    `# ${PROFILE.name}`,
    '',
    `> ${PROFILE.summary}`,
    '',
    `Contact: ${PROFILE.email} · ${PROFILE.links.github} · ${PROFILE.links.linkedin}`,
    '',
    '## Achievements',
    ...ACHIEVEMENTS.map((a) => `- ${a.title}: ${a.metric}. ${a.detail} (${a.date})`),
    '',
    '## Experience',
    ...EXPERIENCE.map((r) => `- ${r.title}, ${r.company} (${r.period}): ${r.summary}`),
    '',
    '## Projects',
    ...PROJECTS.map((p) => `- [${p.name}](/work/${p.slug}): ${p.tagline}`),
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
