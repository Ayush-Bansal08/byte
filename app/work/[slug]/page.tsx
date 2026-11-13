import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CharacterStage } from '@/components/byte/CharacterStage';
import type { Behavior } from '@/lib/byte/director';
import type { Costume, Mood } from '@/lib/byte/engine';
import { SceneFlow } from '@/components/diagrams/SceneFlow';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { PROJECTS, PROJECT_BY_SLUG } from '@/content/projects';
import { SOURCE_BY_ID } from '@/content/sources';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECT_BY_SLUG[slug];
  if (!p) return {};
  return { title: `${p.name}: case study`, description: p.tagline, alternates: { canonical: `/work/${p.slug}` } };
}

type Stage = { behavior: Behavior; costume: Costume; mood: Mood; message?: string; lookAt?: string };

function Block({ n, title, id, stage, children }: { n: number; title: string; id: string; stage?: Stage; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t border-line py-12 lg:grid-cols-[220px_1fr] lg:gap-10">
      <div className="flex items-end gap-3 lg:block">
        <h2 id={id} className="min-w-0 text-xl font-semibold lg:text-[1.15rem]">
          <span className="mr-2 font-mono text-[0.78rem] text-accent">{String(n).padStart(2, '0')}</span>
          {title}
        </h2>
        {stage && (
          <CharacterStage
            id={`block-${id}`}
            {...stage}
            align="left"
            bubble="right"
            lookAt={stage.lookAt ?? `${id}-body`}
            className="h-[104px] min-w-[84px] flex-1 lg:mt-2 lg:h-[210px] lg:w-full"
          />
        )}
      </div>
      <div id={`${id}-body`} className="min-w-0 space-y-4 text-muted">
        {children}
      </div>
    </section>
  );
}

const Ext = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M4 2h6v6M10 2L3 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PROJECT_BY_SLUG[slug];
  if (!p) notFound();
  const idx = PROJECTS.findIndex((x) => x.slug === p.slug);
  const next = PROJECTS[(idx + 1) % PROJECTS.length]!;
  let n = 0;
  const num = () => ++n;

  return (
    <article className="container-page pb-20 pt-10 sm:pt-14" style={{ '--tint': p.tint } as React.CSSProperties}>
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-[0.78rem] text-faint">
        <TransitionLink href="/#work" label="Home" className="link text-muted">
          Work
        </TransitionLink>{' '}
        / <span aria-current="page">{p.name}</span>
      </nav>

      <header className="relative isolate pb-10">
        <div className="hero-sky" aria-hidden="true">
          <div className="hero-grid" />
        </div>
        <div className="flex items-end gap-4">
          <div className="min-w-0">
            <p className="kicker tint-kicker">{p.kicker}</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.035em] sm:text-6xl">{p.name}</h1>
          </div>
          <CharacterStage id={p.slug} behavior="greet" costume={p.costume} mood={p.badge ? 'star' : 'happy'} message={p.byte.intro} className="h-[128px] min-w-[84px] flex-1" />
        </div>
        {p.badge && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[0.07] px-3 py-1 text-[0.85rem] text-gold">
            <span aria-hidden="true">◆</span> {p.badge}
          </p>
        )}
        <p className="mt-5 max-w-3xl text-xl text-text">{p.tagline}</p>
        <dl className="mt-8 grid gap-4 border-t border-line pt-6 text-[0.9rem] sm:grid-cols-4">
          <div>
            <dt className="kicker">When</dt>
            <dd className="mt-1 text-text">{p.period}</dd>
          </div>
          <div>
            <dt className="kicker">Type</dt>
            <dd className="mt-1 text-text">{p.kind}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="kicker">Stack</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {p.demo.map((d) => (
            <a key={d.href} href={d.href} target="_blank" rel="noreferrer" className="btn btn-primary">
              {d.label} <Ext />
            </a>
          ))}
          {p.source.map((s) => (
            <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="btn">
              {s.label} <Ext />
            </a>
          ))}
        </div>
      </header>

      <Block n={num()} title="Overview" id="overview" stage={{ behavior: 'point', costume: p.costume, mood: 'happy', message: p.byte.overview }}>
        {p.overview.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </Block>
      <Block n={num()} title="The problem" id="problem" stage={{ behavior: 'think', costume: p.costume, mood: 'focused', message: p.byte.problem }}>
        {p.problem.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </Block>
      <Block n={num()} title="Why it matters" id="why" stage={{ behavior: 'point', costume: p.costume, mood: 'wink', message: p.byte.why }}>
        {p.whyItMatters.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </Block>
      <Block n={num()} title="My role" id="role" stage={{ behavior: 'wave', costume: p.costume, mood: 'happy', message: p.byte.role }}>
        {p.role.map((t) => (
          <p key={t} className="text-text">
            {t}
          </p>
        ))}
      </Block>
      <Block n={num()} title="Architecture" id="architecture">
        <div className="flex items-end gap-4">
          <h3 className="min-w-0 text-lg font-semibold text-text">{p.architecture.title}</h3>
          <CharacterStage id={`${p.slug}-arch`} behavior="inspect" costume={p.costume} mood="focused" message={p.byte.arch} scene={`${p.slug}-arch`} lookAt={`${p.slug}-arch-flow`} className="h-[112px] min-w-[80px] flex-1" />
        </div>
        <SceneFlow flow={p.architecture} scene={`${p.slug}-arch`} id={`${p.slug}-arch-flow`} />
      </Block>
      <Block n={num()} title="Technical implementation" id="implementation" stage={{ behavior: 'inspect', costume: p.costume, mood: 'focused', message: p.byte.implementation }}>
        {p.implementation.map((s) => (
          <div key={s.heading}>
            <h3 className="font-semibold text-text">{s.heading}</h3>
            {s.body?.map((t) => (
              <p key={t} className="mt-1.5">
                {t}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-2 space-y-1.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-accent/70" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {p.screenshots && (
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {p.screenshots.map((s) => (
              <figure key={s.src} className="m-0">
                <Image src={s.src} alt={s.alt} width={s.width} height={s.height} sizes="(min-width: 1024px) 420px, 100vw" className="rounded-xl border border-line" />
                <figcaption className="mt-2 text-[0.82rem] text-faint">{s.caption}. Screenshot from the project repository (mock data).</figcaption>
              </figure>
            ))}
          </div>
        )}
      </Block>
      <Block n={num()} title="Difficult decisions" id="decisions" stage={{ behavior: 'think', costume: p.costume, mood: 'focused', message: p.byte.decisions }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[0.92rem]">
            <thead>
              <tr className="border-b border-line font-mono text-[0.72rem] uppercase tracking-wider text-faint">
                <th scope="col" className="py-2 pr-4 font-normal">Decision</th>
                <th scope="col" className="py-2 pr-4 font-normal">Why</th>
                <th scope="col" className="py-2 font-normal">Trade-off</th>
              </tr>
            </thead>
            <tbody>
              {p.decisions.map((d) => (
                <tr key={d.decision} className="border-b border-line align-top">
                  <th scope="row" className="py-3 pr-4 font-medium text-text">
                    {d.decision}
                  </th>
                  <td className="py-3 pr-4">{d.why}</td>
                  <td className="py-3">{d.tradeoff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>
      {p.challenges.length > 0 && (
        <Block n={num()} title="Challenges and fixes" id="challenges" stage={{ behavior: 'think', costume: p.costume, mood: 'surprised', message: p.byte.challenges }}>
          <ul className="space-y-4">
            {p.challenges.map((c) => (
              <li key={c.issue} className="rounded-xl border border-line p-4">
                <p className="font-medium text-text">{c.issue}</p>
                <p className="mt-1 text-[0.92rem]">
                  <span className="text-faint">Cause: </span>
                  {c.cause}
                </p>
                <p className="mt-0.5 text-[0.92rem]">
                  <span className="text-faint">Fix: </span>
                  {c.fix}
                </p>
              </li>
            ))}
          </ul>
        </Block>
      )}
      <Block n={num()} title="Testing and reliability" id="testing" stage={{ behavior: 'inspect', costume: 'glasses', mood: 'focused', message: p.byte.testing }}>
        <ul className="space-y-2">
          {p.testing.map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-accent/70" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Block>
      <Block n={num()} title="Measurable outcomes" id="outcomes">
        <div className="flex items-end gap-4">
          <p className="min-w-0 text-[0.92rem]">Verified figures only.</p>
          <CharacterStage id={`${p.slug}-outcomes`} behavior={p.badge ? 'celebrate' : 'point'} costume={p.badge ? 'crown' : p.costume} mood={p.badge ? 'star' : 'happy'} message={p.byte.outcomes} lookAt={`${p.slug}-outcome-grid`} className="h-[112px] min-w-[80px] flex-1" />
        </div>
        <ul id={`${p.slug}-outcome-grid`} className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {p.outcomes.map((o) => (
            <li key={o.label} className="bg-bg-2 p-4">
              <p className="text-2xl font-semibold text-text">{o.metric}</p>
              <p className="mt-1 text-[0.88rem]">{o.label}</p>
            </li>
          ))}
        </ul>
        <div>
          <h3 className="font-semibold text-text">Known limitations</h3>
          <ul className="mt-2 space-y-1.5">
            {p.limitations.map((l) => (
              <li key={l} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-faint" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </Block>
      <Block n={num()} title="Demo" id="demo">
        {p.demo.length ? (
          <ul className="space-y-2">
            {p.demo.map((d) => (
              <li key={d.href}>
                <a href={d.href} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1.5">
                  {d.label} <Ext />
                </a>
                {d.note && <span className="ml-2 text-[0.88rem] text-faint">{d.note}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No public demo. The repository has run instructions.</p>
        )}
      </Block>
      <Block n={num()} title="Source code and evidence" id="source" stage={{ behavior: 'point', costume: 'detective', mood: 'wink', message: p.byte.source }}>
        <ul className="space-y-2">
          {p.sources
            .map((id) => SOURCE_BY_ID[id])
            .filter((s) => s.url)
            .map((s) => (
              <li key={s.id}>
                <a href={s.url!} {...(s.url!.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} className="link inline-flex items-center gap-1.5">
                  {s.title} {s.url!.startsWith('http') && <Ext />}
                </a>
              </li>
            ))}
        </ul>
      </Block>
      <Block n={num()} title="Takeaways" id="takeaways" stage={{ behavior: 'wave', costume: p.costume, mood: 'star', message: p.byte.takeaways }}>
        <ul className="space-y-2">
          {p.takeaways.map((t) => (
            <li key={t} className="flex gap-3 text-text">
              <span aria-hidden="true" className="text-accent">→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Block>

      <div className="mt-6 flex flex-col gap-3 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
        <TransitionLink href="/#work" label="Home" className="link text-muted">
          ← All work
        </TransitionLink>
        <TransitionLink href={`/work/${next.slug}`} label={next.name} className="group text-right">
          <span className="kicker block">Next case study</span>
          <span className="text-2xl font-semibold text-text transition-colors group-hover:text-accent">{next.name} →</span>
        </TransitionLink>
      </div>
    </article>
  );
}
