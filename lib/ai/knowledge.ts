import { ACHIEVEMENTS, EXPERIENCE, PROFILE, SKILLS, LANGUAGES } from '@/content/profile';
import { PROJECTS } from '@/content/projects';
import type { SourceId } from '@/content/sources';

export type Chunk = { id: string; title: string; text: string; sources: SourceId[]; project?: string; tags: string[] };

const join = (xs: (string | undefined)[]) => xs.filter(Boolean).join(' ');

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [
    {
      id: 'profile',
      title: 'Who Ayush is',
      text: join([
        `${PROFILE.name} is a software engineering student at ${PROFILE.education.school} (${PROFILE.education.degree}, ${PROFILE.education.period}, expected graduation 2028).`,
        PROFILE.summary,
        `He is looking for: ${PROFILE.seeking}`,
      ]),
      sources: ['resume', 'gh-profile'],
      tags: ['about', 'who', 'student', 'graduation', 'education', 'lnmiit', 'internship', 'looking'],
    },
    {
      id: 'about',
      title: 'About Ayush',
      text: PROFILE.about.join(' '),
      sources: ['resume', 'gh-profile'],
      tags: ['about', 'interests'],
    },
    {
      id: 'contact',
      title: 'How to contact Ayush',
      text: `Email: ${PROFILE.email}. LinkedIn: ${PROFILE.links.linkedin}. GitHub: ${PROFILE.links.github}. The résumé is on this site at /resume.`,
      sources: ['gh-profile', 'linkedin'],
      tags: ['contact', 'email', 'hire', 'reach', 'linkedin', 'resume', 'cv'],
    },
    {
      id: 'languages',
      title: 'Programming languages',
      text: `Languages Ayush uses: ${LANGUAGES.join(', ')}.`,
      sources: ['resume'],
      tags: ['languages', 'skills', 'technologies'],
    },
  ];

  for (const a of ACHIEVEMENTS) {
    chunks.push({
      id: `achievement-${a.id}`,
      title: `${a.title}: ${a.metric}`,
      text: `${a.title} (${a.date}): ${a.metric}. ${a.detail}.`,
      sources: a.sources,
      tags: ['achievement', 'award', 'hackathon', 'win', a.id],
    });
  }

  for (const r of EXPERIENCE) {
    chunks.push({
      id: `experience-${r.id}`,
      title: `${r.title} at ${r.company}`,
      text: join([`${r.title} at ${r.company}, ${r.period}, ${r.place}.`, r.summary, ...r.bullets, `Technologies: ${r.stack.join(', ')}.`]),
      sources: r.sources,
      tags: ['experience', 'internship', 'work', r.id],
    });
  }

  for (const s of SKILLS) {
    chunks.push({
      id: `skills-${s.id}`,
      title: `Skills: ${s.title}`,
      text: `${s.title}. ${s.capability} ${s.items.join('; ')}. Evidence: ${s.evidence.map((e) => e.label).join(', ')}.`,
      sources: ['resume', 'gh-profile'],
      tags: ['skills', 'technologies', 'stack', s.id],
    });
  }

  for (const p of PROJECTS) {
    const base = { project: p.slug, sources: p.sources };
    chunks.push({
      ...base,
      id: `${p.slug}-overview`,
      title: `${p.name}: overview`,
      text: join([`${p.name} (${p.kind}, ${p.period}). ${p.tagline}`, p.badge ? `Recognition: ${p.badge}.` : undefined, ...p.overview, `Stack: ${p.stack.join(', ')}.`]),
      tags: ['project', p.slug, ...p.stack.map((s) => s.toLowerCase())],
    });
    chunks.push({
      ...base,
      id: `${p.slug}-why`,
      title: `${p.name}: problem and why it matters`,
      text: join([...p.problem, ...p.whyItMatters]),
      tags: ['project', p.slug, 'problem', 'why'],
    });
    chunks.push({
      ...base,
      id: `${p.slug}-role`,
      title: `${p.name}: Ayush's role`,
      text: p.role.join(' '),
      tags: ['project', p.slug, 'role', 'contribution', 'team'],
    });
    chunks.push({
      ...base,
      id: `${p.slug}-how`,
      title: `${p.name}: how it works`,
      text: join([
        `${p.architecture.title}: ${p.architecture.caption}`,
        ...p.architecture.steps.map((s) => `${s.label}: ${s.detail}`),
        ...p.implementation.flatMap((i) => [i.heading + '.', ...(i.body ?? []), ...(i.bullets ?? [])]),
      ]),
      tags: ['project', p.slug, 'architecture', 'how', 'works', 'implementation'],
    });
    chunks.push({
      ...base,
      id: `${p.slug}-results`,
      title: `${p.name}: results, testing and limits`,
      text: join([
        ...p.outcomes.map((o) => `${o.metric} ${o.label}.`),
        ...p.testing,
        ...p.decisions.map((d) => `Decision: ${d.decision}. ${d.why} Trade-off: ${d.tradeoff}`),
        ...p.limitations.map((l) => `Limitation: ${l}`),
      ]),
      tags: ['project', p.slug, 'results', 'testing', 'outcome', 'limitations', 'tradeoffs'],
    });
  }
  return chunks;
}

export const CHUNKS: Chunk[] = buildChunks();

// ------------------------------------------------------------ offline answers
export type Faq = { id: string; keys: string[]; answer: string; sources: SourceId[]; action?: { type: 'goto'; target: string } };

/** Curated, verified answers used when no model key is configured. */
export const FAQ: Faq[] = [
  {
    id: 'who',
    keys: ['who is ayush', 'who is he', 'about ayush', 'introduce', 'tell me about', 'who are you talking'],
    answer:
      'Ayush Bansal is a software engineering student at LNMIIT Jaipur (graduating 2028) who builds backend systems, cloud platforms and AI agents. He placed 2nd in the 0G track at ETHGlobal Mumbai 2026 with SAKA, interned as a software engineer at Finn, and was an AI/ML research intern at UNSW Sydney.',
    sources: ['resume', 'gh-profile'],
  },
  {
    id: 'ethglobal',
    keys: ['ethglobal', 'what did he build at', 'hackathon win', 'prize', 'mumbai'],
    answer:
      'At ETHGlobal Mumbai 2026 his team built SAKA, an AI DeFi agent that plans on 0G and trades on Uniswap through a safety pipeline. It won 2nd place in the 0G "Build with 0G Private Computer" track ($1,500).',
    sources: ['saka-showcase', 'resume'],
    action: { type: 'goto', target: 'saka' },
  },
  {
    id: 'saka-how',
    keys: ['how does saka work', 'saka work', 'saka pipeline', 'saka safe', 'how is saka safe'],
    answer:
      'SAKA’s AI only proposes. Every money-moving request is prepared into a transaction, given a deterministic 0–100 safety score, simulated, checked by an independent 0G AI guard that fails closed, and then a pure policy function decides: run automatically, ask for approval, or refuse with a reason. Each decision is logged to 0G Storage with a verifiable hash.',
    sources: ['saka-repo', 'saka-showcase'],
    action: { type: 'goto', target: 'saka' },
  },
  {
    id: 'saka-role',
    keys: ['role in saka', 'saka role', 'saka team', 'contribute to saka', 'build saka alone'],
    answer:
      'SAKA was a team hackathon entry. All 41 commits in the public repository are authored from Ayush’s GitHub account, covering the 0G integration, the Market Event Simulator, guard and execution fixes, passkey auth, the Azure deployment and the interface. The showcase doesn’t list team members, so I won’t attribute other work.',
    sources: ['saka-repo'],
  },
  {
    id: 'lnmhacks',
    keys: ['lnmhacks', 'lnm hacks'],
    answer: 'At LNMHacks 8.0 (January 2026) Ayush won 1st place in the Viral Consumer Apps track, a $600 partner prize, at an event with 500+ participants.',
    sources: ['resume', 'gh-profile'],
  },
  {
    id: 'unsw',
    keys: ['unsw', 'research', 'sydney', 'som', 'self-organizing', 'paper'],
    answer:
      'At UNSW Sydney (May–Aug 2026, remote) he worked with Dr. Rohitash Chandra on SOM-Gold, using self-organizing maps and autoencoders on hyperspectral satellite data for gold exploration. He fixed a training bug that raised mineral recall from 0% to 76.6%, corrected 8 pipeline bugs, and built the evaluation framework. He is second author on the paper, which is under review.',
    sources: ['resume', 'som-citation', 'som-repo'],
    action: { type: 'goto', target: 'som-gold' },
  },
  {
    id: 'backend',
    keys: ['backend', 'finn', 'airforge', 'production', 'apis', 'industry experience'],
    answer:
      'At Finn (Airforge Tech, May–Jul 2026) he merged 25+ PRs across 5+ production services: AI voice agents, backend APIs, authentication, WhatsApp automation and deployment, with twice-weekly releases using Docker, Kubernetes and Nginx. In projects, SAKA has a Fastify API with a BullMQ worker, and PollForge is a five-service event-driven system.',
    sources: ['resume', 'saka-repo', 'pollforge-repo'],
    action: { type: 'goto', target: 'experience' },
  },
  {
    id: 'kubernetes',
    keys: ['kubernetes', 'k8s', 'devops', 'cloud', 'platform', 'aks', 'docker'],
    answer:
      'Yes. Helios is a Kubernetes developer platform with a custom Go operator, ArgoCD GitOps and Prometheus-gated canary releases on k3s/Azure. PollForge runs on Azure AKS with OIDC-based CI/CD, and at Finn he worked with Docker, Kubernetes and Nginx in production.',
    sources: ['helios-repo', 'pollforge-repo', 'resume'],
    action: { type: 'goto', target: 'helios' },
  },
  {
    id: 'tech',
    keys: ['technologies', 'tech stack', 'what does he use', 'languages', 'skills'],
    answer:
      'Mostly TypeScript/Node.js and Python for services, Go for Kubernetes tooling, and Docker, Kubernetes, Terraform and GitHub Actions for delivery. For AI: LLM agents, MCP servers, Ollama and PyTorch. He also uses PostgreSQL, Redis and Prometheus.',
    sources: ['resume', 'gh-profile'],
    action: { type: 'goto', target: 'skills' },
  },
  {
    id: 'strongest',
    keys: ['strongest project', 'best project', 'best work', 'most impressive', 'show me', 'favourite project'],
    answer:
      'SAKA is the strongest single project: an AI agent that can move money, wrapped in deterministic safety checks, with 600+ tests and a 2nd-place hackathon finish. For platform depth, look at Helios and its Go operator.',
    sources: ['saka-showcase', 'saka-repo', 'helios-repo'],
    action: { type: 'goto', target: 'saka' },
  },
  {
    id: 'contact',
    keys: ['contact', 'email', 'hire', 'reach', 'linkedin', 'resume', 'cv'],
    answer: 'Email ab262133@gmail.com, or find him on LinkedIn and GitHub. The résumé is linked in the navigation.',
    sources: ['gh-profile', 'linkedin'],
    action: { type: 'goto', target: 'contact' },
  },
  {
    id: 'available',
    keys: ['is he available', 'available', 'open to', 'looking for', 'hire him', 'hiring'],
    answer:
      'Yes. Ayush is looking for software engineering internships in backend, cloud/platform, AI/ML and AI agents. He graduates from LNMIIT in 2028. The fastest route is email: ab262133@gmail.com.',
    sources: ['gh-profile', 'resume'],
    action: { type: 'goto', target: 'contact' },
  },
  {
    id: 'site',
    keys: ['this site', 'this website', 'this portfolio', 'built this', 'how was this', 'how is this site'],
    answer:
      'This site is Next.js and TypeScript. I’m drawn in SVG and animated by a custom state machine with fixed-step physics: walking, jumping, sleeping and costume changes are all code. My answers come from a knowledge base built from his verified résumé and repositories.',
    sources: ['gh-profile'],
  },
  {
    id: 'byte',
    keys: ['who are you', 'what are you', 'are you ai', 'byte', 'are you real'],
    answer: 'I’m Byte, this site’s guide. I’m drawn and animated in code. I only answer from Ayush’s verified résumé, repositories and project pages, and I link the evidence.',
    sources: ['gh-profile'],
  },
];
