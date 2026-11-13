import { CharacterStage } from '@/components/byte/CharacterStage';
import { ByteFigure } from '@/components/byte/ByteFigure';
import { ProjectVisual } from '@/components/diagrams/ProjectVisual';
import { SceneFlow } from '@/components/diagrams/SceneFlow';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { ACHIEVEMENTS, EXPERIENCE, PROFILE, SKILLS } from '@/content/profile';
import { FEATURED, OTHER_PROJECTS, PROJECTS } from '@/content/projects';
import type { Behavior } from '@/lib/byte/director';
import type { Costume, Mood } from '@/lib/byte/engine';
import { AskCta } from './AskCta';

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
    <path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const External = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M4 2h6v6M10 2L3 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

function SectionHead({
  id,
  index,
  kicker,
  title,
  intro,
  stage,
}: {
  id: string;
  index: string;
  kicker: string;
  title: string;
  intro?: string;
  stage: { behavior: Behavior; costume?: Costume; mood?: Mood; message?: string; lookAt?: string; scene?: string };
}) {
  return (
    <div className="mb-10">
      <div className="flex items-end gap-4">
        <div className="min-w-0">
          <p className="kicker">
            <span className="glow-num text-accent">{index}</span> · {kicker}
          </p>
          <h2 id={`${id}-title`} className="mt-2 text-3xl font-semibold sm:text-4xl">
            {title}
          </h2>
        </div>
        <CharacterStage id={id} {...stage} className="h-[116px] min-w-[84px] flex-1" />
      </div>
      {intro && <p className="mt-4 max-w-2xl text-muted">{intro}</p>}
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="container-page relative isolate grid gap-10 pb-16 pt-2 sm:pt-10 lg:grid-cols-[1.25fr_1fr] lg:pt-20 lg:items-end lg:gap-14 lg:pb-24">
      <div className="hero-sky" aria-hidden="true">
        <div className="hero-grid" />
      </div>
      <div>
        <div className="flex items-end gap-3">
          <p className="kicker min-w-0 pb-1">Backend · Cloud · AI agents</p>
          <CharacterStage
            id="top-m"
            behavior="greet"
            mood="happy"
            bubble="left"
            message="Hi! I’m Byte, the cursor from his name. I grew legs. Tap me and ask anything."
            className="h-[112px] min-w-[84px] flex-1 lg:hidden"
          />
        </div>
        <h1 id="hero-title" className="mt-3 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[4.2rem]">
          I build the parts of software you only notice <span className="ink">when they break.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[1.08rem] text-muted">{PROFILE.intro}</p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <a href="#work" className="btn btn-primary group">
            Explore projects <Arrow />
          </a>
          <TransitionLink href="/resume" label="Résumé" className="btn">
            View résumé
          </TransitionLink>
          <a href={PROFILE.links.github} target="_blank" rel="noreferrer" className="btn">
            GitHub <External />
          </a>
          <a href="#contact" className="btn">
            Contact
          </a>
        </div>
      </div>
      <div className="relative">
        <CharacterStage
          id="top"
          behavior="greet"
          mood="happy"
          bubble="left"
          align="right"
          message="Hi! I’m Byte, the cursor from his name. I grew legs and read every page here. Want the quick tour?"
          choices={[
            { id: 'tour', label: 'Show me his best work' },
            { id: 'ask', label: 'Ask a question' },
            { id: 'look', label: 'I’ll look around' },
          ]}
          className="hidden h-[176px] w-full lg:block"
        />
        <div className="static-byte absolute right-8 top-[176px] max-lg:hidden" aria-hidden="true">
          <ByteFigure baseScale={1.15} />
        </div>
        <div className="card overflow-hidden font-mono text-[0.82rem] leading-relaxed" role="group" aria-label="Quick facts">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-danger/60" />
            <span className="size-2.5 rounded-full bg-gold/60" />
            <span className="size-2.5 rounded-full bg-accent/60" />
            <span className="ml-2 text-[0.72rem] text-faint">ayush@portfolio: ~</span>
          </div>
          <dl className="space-y-2.5 px-4 py-4">
            <div className="term-line" style={{ animationDelay: '150ms' }}>
              <dt className="text-faint">
                <span className="text-accent">$</span> whoami
              </dt>
              <dd className="text-text">ayush bansal · gurgaon, india</dd>
            </div>
            <div className="term-line" style={{ animationDelay: '450ms' }}>
              <dt className="text-faint">
                <span className="text-accent">$</span> ls ./work
              </dt>
              <dd className="-my-1 flex flex-wrap gap-x-3">
                {PROJECTS.map((x) => (
                  <span key={x.slug} style={{ color: x.tint }}>
                    <TransitionLink href={`/work/${x.slug}`} label={x.name} className="inline-block py-1 underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current">
                      {x.slug}/
                    </TransitionLink>
                  </span>
                ))}
              </dd>
            </div>
            <div className="term-line" style={{ animationDelay: '750ms' }}>
              <dt className="text-faint">
                <span className="text-accent">$</span> byte --help
              </dt>
              <dd className="term-caret text-text">usage: tap me, ask about any project</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export function Achievements() {
  return (
    <section id="achievements" aria-labelledby="achievements-title" className="border-y border-line bg-bg-2/60">
      <div className="container-page py-14">
        <div className="flex items-end gap-4">
          <h2 id="achievements-title" className="kicker min-w-0 pb-6">
            <span className="glow-num text-accent">01</span> · Wins
          </h2>
          <CharacterStage id="achievements" behavior="celebrate" costume="crown" mood="star" message="Judges picked two of these. The third is still with the reviewers. Fingers crossed." className="h-[112px] min-w-[84px] flex-1" />
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const inner = (
              <>
                <p className="ink-gold text-[1.65rem] font-semibold leading-none tracking-tight">{a.metric}</p>
                <p className="mt-3 font-medium text-text">{a.title}</p>
                <p className="mt-1 text-[0.9rem] leading-snug text-muted">{a.detail}</p>
                <p className="mt-3 font-mono text-[0.7rem] text-faint">{a.date}</p>
              </>
            );
            return (
              <li key={a.id} className="bg-bg-2">
                {a.href ? (
                  a.href.startsWith('/work') ? (
                    <TransitionLink href={a.href} className="block h-full p-5 transition-colors hover:bg-surface-2">
                      {inner}
                    </TransitionLink>
                  ) : (
                    <a href={a.href.replace('/', '')} className="block h-full p-5 transition-colors hover:bg-surface-2">
                      {inner}
                    </a>
                  )
                ) : (
                  <div className="h-full p-5">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Work() {
  const p = FEATURED;
  return (
    <section id="work" aria-labelledby="work-title" className="container-page py-24">
      <SectionHead
        id="work"
        index="02"
        kicker="Selected work"
        title="Things I’ve built"
        intro="Open any of them for the full story, including what broke and what still isn’t finished."
        stage={{ behavior: 'point', costume: 'detective', mood: 'wink', message: 'Pick any card and I’ll hop over and tell you about it.', lookAt: 'saka' }}
      />

      <article id="saka" aria-labelledby="saka-title" data-tinted="" style={{ '--tint': p.tint } as React.CSSProperties} className="card relative p-5 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="min-w-0">
            <p className="kicker tint-kicker">{p.kicker}</p>
            <h3 id="saka-title" className="mt-2 text-3xl font-semibold sm:text-[2.4rem]">
              {p.name}
            </h3>
          </div>
          <CharacterStage
            id="saka"
            behavior="inspect"
            costume="agent"
            mood="focused"
            scene="saka-pipeline"
            lookAt="saka-pipeline"
            message={p.byte.card}
            className="h-[112px] min-w-[84px] flex-1"
          />
        </div>
        <p className="mt-4 max-w-3xl text-[1.1rem] text-text">{p.tagline}</p>

        <dl className="mt-6 grid gap-5 text-[0.95rem] sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['Problem', p.card.problem],
              ['Solution', p.card.solution],
              ['My contribution', p.card.contribution],
              ['Outcome', p.card.outcome],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="kicker">{k}</dt>
              <dd className="mt-1.5 text-muted">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7">
          <SceneFlow flow={p.architecture} scene="saka-pipeline" id="saka-pipeline" compact />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {p.stack.slice(0, 9).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <TransitionLink href={`/work/${p.slug}`} label={p.name} className="btn btn-primary group">
            Read the case study <Arrow />
          </TransitionLink>
          {p.demo.map((d) => (
            <a key={d.href} href={d.href} target="_blank" rel="noreferrer" className="btn">
              {d.label} <External />
            </a>
          ))}
          <a href={p.source[0]!.href} target="_blank" rel="noreferrer" className="btn">
            Source <External />
          </a>
        </div>
      </article>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {OTHER_PROJECTS.map((q) => (
          <article key={q.slug} id={q.slug} aria-labelledby={`${q.slug}-title`} data-tinted="" style={{ '--tint': q.tint } as React.CSSProperties} className="card group/card flex flex-col p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <p className="kicker tint-kicker">{q.kicker}</p>
                <h3 id={`${q.slug}-title`} className="mt-1.5 text-2xl font-semibold">
                  {q.name}
                </h3>
              </div>
              <CharacterStage
                id={q.slug}
                behavior="inspect"
                costume={q.costume}
                mood={q.slug === 'som-gold' ? 'focused' : q.slug === 'pollforge' ? 'wink' : 'happy'}
                scene={`${q.slug}-visual`}
                lookAt={`${q.slug}-visual`}
                message={q.byte.card}
                className="h-[106px] min-w-[80px] flex-1"
              />
            </div>
            <p className="mt-3 text-muted">{q.tagline}</p>
            <div className="mt-4">
              <ProjectVisual slug={q.slug} id={`${q.slug}-visual`} />
            </div>
            <dl className="mt-4 space-y-2 text-[0.9rem]">
              <div>
                <dt className="inline font-medium text-text">My part: </dt>
                <dd className="inline text-muted">{q.card.contribution}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-text">Outcome: </dt>
                <dd className="inline text-muted">{q.card.outcome}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {q.stack.slice(0, 6).map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 text-[0.92rem]">
              <TransitionLink href={`/work/${q.slug}`} label={q.name} className="group inline-flex items-center gap-1.5 font-medium text-accent">
                Case study <Arrow />
              </TransitionLink>
              {q.source[0] && (
                <a href={q.source[0].href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-text">
                  {q.slug === 'som-gold' ? 'Research repo' : 'GitHub'} <External />
                </a>
              )}
              {q.demo[0] && (
                <a href={q.demo[0].href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-text">
                  {q.demo[0].label} <External />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="border-t border-line">
      <div className="container-page py-24">
        <SectionHead
          id="experience"
          index="03"
          kicker="Experience"
          title="One summer, two very different jobs"
          stage={{ behavior: 'point', costume: 'headset', mood: 'happy', lookAt: 'role-finn', message: 'Same summer, both jobs. One in production, one in a research paper.' }}
        />
        <ol className="rail relative space-y-10 border-l pl-6 sm:pl-8">
          {EXPERIENCE.map((r) => (
            <li key={r.id} id={`role-${r.id}`} className="relative">
              <span aria-hidden="true" className="absolute -left-[31px] top-2 size-3 rounded-full border-2 border-accent bg-bg sm:-left-[39px]" />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-xl font-semibold">
                  {r.title.split(',')[0]} · <span className="text-accent">{r.company}</span>
                </h3>
                <p className="font-mono text-[0.78rem] text-faint">
                  {r.period} · {r.place}
                </p>
              </div>
              {r.title.includes(',') && <p className="mt-0.5 text-[0.9rem] text-muted">{r.title.split(',').slice(1).join(',').trim()}</p>}
              <div className="mt-3 flex items-end gap-3">
                <p className="min-w-0 text-text">{r.summary}</p>
                <CharacterStage
                  id={`role-${r.id}-perch`}
                  behavior={r.id === 'unsw' ? 'think' : 'point'}
                  costume={r.id === 'unsw' ? 'cap' : 'headset'}
                  mood={r.id === 'unsw' ? 'focused' : 'happy'}
                  lookAt={`role-${r.id}`}
                  message={r.id === 'unsw' ? 'Remote internship with a Sydney lab. The SOM-Gold write-up has the details.' : 'Voice agents in front, APIs and deploys behind them. He worked on both.'}
                  className="h-[104px] min-w-[84px] flex-1"
                />
              </div>
              <ul className="mt-3 space-y-2 text-muted">
                {r.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-accent/70" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {r.stack.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
              {r.link && (
                <TransitionLink href={r.link.href} label="SOM-Gold" className="group mt-4 inline-flex items-center gap-1.5 text-[0.92rem] font-medium text-accent">
                  {r.link.label} <Arrow />
                </TransitionLink>
              )}
            </li>
          ))}
          <li className="relative">
            <span aria-hidden="true" className="absolute -left-[31px] top-2 size-3 rounded-full border-2 border-line-strong bg-bg sm:-left-[39px]" />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-xl font-semibold">Education · {PROFILE.education.school}</h3>
              <p className="font-mono text-[0.78rem] text-faint">{PROFILE.education.period}</p>
            </div>
            <p className="mt-1 text-muted">{PROFILE.education.degree}</p>
          </li>
        </ol>
      </div>
    </section>
  );
}

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="border-t border-line bg-bg-2/60">
      <div className="container-page py-24">
        <SectionHead
          id="skills"
          index="04"
          kicker="Technical strengths"
          title="Toolbox, sorted by job"
          intro="No five-star skill bars. Each group ends with the projects where it was actually used."
          stage={{ behavior: 'think', costume: 'glasses', mood: 'focused', message: 'Find the card closest to your team’s stack. I’ll wait.' }}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((g) => (
            <div key={g.id} className="card p-5">
              <h3 className="text-lg font-semibold">{g.title}</h3>
              <p className="mt-1.5 text-[0.92rem] text-muted">{g.capability}</p>
              <ul className="mt-4 space-y-1.5 text-[0.92rem]">
                {g.items.map((i) => (
                  <li key={i} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[0.62em] size-1 shrink-0 rounded-full bg-accent" />
                    {i}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-line pt-3 text-[0.82rem] text-faint">
                Proven in{' '}
                {g.evidence.map((e, k) => (
                  <span key={e.label}>
                    {e.href.startsWith('/work') ? (
                      <TransitionLink href={e.href} label={e.label} className="link text-muted">
                        {e.label}
                      </TransitionLink>
                    ) : (
                      <a href={e.href.startsWith('/#') ? e.href.slice(1) : e.href} className="link text-muted" {...(e.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
                        {e.label}
                      </a>
                    )}
                    {k < g.evidence.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
          ))}
          <div className="card flex flex-col justify-between p-5">
            <div>
              <h3 className="text-lg font-semibold">Languages</h3>
              <p className="mt-3 font-mono text-[0.88rem] leading-relaxed text-muted">Python · TypeScript · JavaScript · Go · Java · C/C++ · C# · Bash</p>
            </div>
            <AskCta />
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-line">
      <div className="container-page grid gap-10 py-24 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="kicker">
            <span className="glow-num text-accent">05</span> · About
          </p>
          <h2 id="about-title" className="mt-2 text-3xl font-semibold sm:text-4xl">
            A bit about me
          </h2>
          <CharacterStage id="about" behavior="wave" costume="beanie" mood="happy" message="Quieter section. This one’s about him rather than the projects." className="mt-4 h-[118px] w-full" align="left" bubble="right" />
        </div>
        <div className="space-y-5 text-[1.05rem] text-muted">
          {PROFILE.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-line bg-bg-2/60">
      <div className="container-page py-24">
        <div className="card orbit relative overflow-hidden p-6 sm:p-10">
          <div className="flex items-end gap-4">
            <div className="min-w-0">
              <p className="kicker">
                <span className="glow-num text-accent">06</span> · Contact
              </p>
              <h2 id="contact-title" className="mt-2 text-3xl font-semibold sm:text-5xl">
                Hiring an intern? <span className="ink">Let’s talk.</span>
              </h2>
            </div>
            <CharacterStage id="contact" behavior="wave" mood="heart" message="This is where I hand you over. No forms. Just his inbox and his phone." className="h-[118px] min-w-[84px] flex-1" />
          </div>
          <p className="mt-5 max-w-xl text-muted">I’m looking for software engineering internships in backend, cloud and AI. Email or call me, whichever’s easier. LinkedIn and GitHub work too.</p>
          <a href={PROFILE.links.email} className="mt-7 inline-block break-all text-2xl font-semibold text-accent underline decoration-accent/40 underline-offset-[6px] transition-colors hover:decoration-accent sm:text-3xl">
            {PROFILE.email}
          </a>
          <p className="mt-3">
            <a href={PROFILE.links.phone} className="font-mono text-lg text-text underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-accent">
              {PROFILE.phone}
            </a>
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <a href={PROFILE.links.linkedin} target="_blank" rel="noreferrer" className="btn">
              LinkedIn <External />
            </a>
            <a href={PROFILE.links.github} target="_blank" rel="noreferrer" className="btn">
              GitHub <External />
            </a>
            <TransitionLink href="/resume" label="Résumé" className="btn">
              Résumé
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
