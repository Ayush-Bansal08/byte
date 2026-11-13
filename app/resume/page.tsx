import type { Metadata } from 'next';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ACHIEVEMENTS, EXPERIENCE, LANGUAGES, PROFILE, SKILLS } from '@/content/profile';
import { PROJECTS } from '@/content/projects';
import { CharacterStage } from '@/components/byte/CharacterStage';

export const metadata: Metadata = { title: 'Résumé', description: `Résumé of ${PROFILE.name}`, alternates: { canonical: '/resume' } };

export default function ResumePage() {
  const hasPdf = existsSync(path.join(process.cwd(), 'public', 'resume.pdf'));
  return (
    <div className="container-page max-w-[860px] pb-20 pt-10 sm:pt-14 print:max-w-none print:p-0">
      <div className="mb-8 flex flex-wrap items-end gap-4 print:hidden">
        <div className="min-w-0">
          <p className="kicker">Résumé</p>
          <h1 className="mt-2 text-4xl font-semibold">{PROFILE.name}</h1>
        </div>
        <CharacterStage id="resume" behavior="point" costume="glasses" mood="wink" message="The whole story, minus my commentary. The PDF is the original, links and all." className="h-[118px] min-w-[84px] flex-1" />
        <div className="flex w-full flex-wrap gap-2">
          {hasPdf && (
            <>
              <a href="/resume.pdf" download="Ayush-Bansal-Resume.pdf" className="btn btn-primary" data-testid="resume-download">
                Download PDF
              </a>
              <a href="/resume.pdf" target="_blank" rel="noreferrer" className="btn">
                Open in a new tab
              </a>
            </>
          )}
        </div>
      </div>

      <article className="card space-y-8 p-6 text-[0.95rem] sm:p-9 print:border-0 print:bg-white print:p-0 print:text-black">
        <header>
          <h2 className="text-2xl font-semibold print:text-black">{PROFILE.name}</h2>
          <p className="mt-1 text-muted print:text-black">
            <a className="link" href={PROFILE.links.email}>
              {PROFILE.email}
            </a>{' '}
            ·{' '}
            <a className="link" href={PROFILE.links.linkedin}>
              LinkedIn
            </a>{' '}
            ·{' '}
            <a className="link" href={PROFILE.links.github}>
              github.com/Ayush-Bansal08
            </a>
          </p>
        </header>

        <section>
          <h3 className="kicker border-b border-line pb-1.5">Education</h3>
          <div className="mt-3 flex flex-wrap justify-between gap-2">
            <p className="font-medium text-text print:text-black">{PROFILE.education.school}</p>
            <p className="font-mono text-[0.8rem] text-faint">{PROFILE.education.period}</p>
          </div>
          <p className="text-muted">{PROFILE.education.degree}, {PROFILE.education.place}</p>
        </section>

        <section>
          <h3 className="kicker border-b border-line pb-1.5">Achievements</h3>
          <ul className="mt-3 space-y-2">
            {ACHIEVEMENTS.slice(0, 2).map((a) => (
              <li key={a.id}>
                <span className="font-medium text-text print:text-black">
                  {a.title}: {a.metric}
                </span>{' '}
                <span className="text-muted">· {a.detail} · {a.date}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="kicker border-b border-line pb-1.5">Experience</h3>
          {EXPERIENCE.map((r) => (
            <div key={r.id} className="mt-4">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium text-text print:text-black">
                  {r.company} · {r.title}
                </p>
                <p className="font-mono text-[0.8rem] text-faint">
                  {r.period} · {r.place}
                </p>
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted">
                {r.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section>
          <h3 className="kicker border-b border-line pb-1.5">Projects</h3>
          {PROJECTS.filter((p) => p.slug !== 'som-gold').map((p) => (
            <div key={p.slug} className="mt-4">
              <p className="font-medium text-text print:text-black">
                {p.name} <span className="font-normal text-faint">· {p.stack.slice(0, 7).join(', ')}</span>
              </p>
              <p className="mt-1 text-muted">{p.tagline}</p>
              <p className="mt-0.5 text-muted">{p.card.outcome}</p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="kicker border-b border-line pb-1.5">Skills</h3>
          <dl className="mt-3 space-y-1.5">
            <div>
              <dt className="inline font-medium text-text print:text-black">Languages: </dt>
              <dd className="inline text-muted">{LANGUAGES.join(', ')}</dd>
            </div>
            {SKILLS.map((g) => (
              <div key={g.id}>
                <dt className="inline font-medium text-text print:text-black">{g.title}: </dt>
                <dd className="inline text-muted">{g.items.join('; ')}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </div>
  );
}
