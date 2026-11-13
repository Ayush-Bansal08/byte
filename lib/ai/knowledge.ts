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
// An id starting with a project slug (saka-, helios-…) ties an answer to that project: it is still used when the
// question names the project, while general answers step aside so the project's own material answers.

/** Curated, verified answers used when no model key is configured. */
export const FAQ: Faq[] = [
  {
    id: 'who',
    keys: ['who is ayush', 'who is he', 'about ayush', 'introduce', 'tell me about him', 'tell me about ayush', 'about yourself', 'who are you talking', 'what does he do', 'what does ayush do', 'summary', 'summarize', 'tl;dr', 'tldr'],
    answer:
      'Ayush Bansal is a software engineering student at LNMIIT Jaipur (graduating 2028) who builds backend systems, cloud platforms and AI agents. He placed 2nd in the 0G track at ETHGlobal Mumbai 2026 with SAKA, interned as a software engineer at Finn, and was an AI/ML research intern at UNSW Sydney.',
    sources: ['resume', 'gh-profile'],
  },
  {
    id: 'name',
    keys: ['his name', 'whats his name', 'what is his name', 'full name', 'name of the', 'who made this', 'whose portfolio', 'whose site', 'whose website'],
    answer: 'His name is Ayush Bansal. This is his portfolio: he is a software engineering student at LNMIIT Jaipur who builds backend systems, cloud platforms and AI agents.',
    sources: ['resume', 'gh-profile'],
  },
  {
    id: 'education',
    keys: ['college', 'university', 'degree', 'b.tech', 'btech', 'lnmiit', 'education', 'student', 'graduat*', 'which year', 'what year', 'his branch', 'his major', 'what does he study', 'where does he study', 'where did he study', 'is he studying', 'studies at', 'batch', 'cgpa', 'gpa'],
    answer:
      'He is studying for a B.Tech in Electronics and Communication Engineering at The LNM Institute of Information Technology (LNMIIT), Jaipur. The course runs from August 2024 to June 2028, so he graduates in 2028. Grades are not published on this site.',
    sources: ['resume'],
    action: { type: 'goto', target: 'experience' },
  },
  {
    id: 'location',
    keys: ['where is he', 'where does he live', 'based in', 'location', 'which city', 'which country', 'hometown', 'where is ayush', 'from india', 'relocate'],
    answer:
      'He is based in Jaipur, India, where he studies at LNMIIT. His Finn internship was in Bengaluru, and his UNSW Sydney research internship was remote.',
    sources: ['resume'],
  },
  {
    id: 'github',
    keys: ['github', 'repositories', 'repos', 'source code', 'open source'],
    answer:
      'His GitHub is github.com/Ayush-Bansal08. The SAKA, Helios, DockHealer and PollForge repositories are public, and each project card here links straight to its code.',
    sources: ['gh-profile', 'saka-repo', 'helios-repo', 'dockhealer-repo', 'pollforge-repo'],
    action: { type: 'goto', target: 'work' },
  },
  {
    id: 'experience',
    keys: ['experience', 'internship', 'internships', 'interned', 'worked at', 'where has he worked', 'work history', 'companies', 'jobs', 'job'],
    answer:
      'Two internships in 2026. At Finn (Airforge Tech), May–July in Bengaluru, he merged 25+ pull requests across 5+ production services, including AI voice agents, APIs and deployment infrastructure. At UNSW Sydney, May–August (remote), he was an AI/ML research intern on the SOM-Gold paper, which is under review.',
    sources: ['resume'],
    action: { type: 'goto', target: 'experience' },
  },
  {
    id: 'projects',
    keys: ['projects', 'what has he built', 'what did he build', 'what has he made', 'how many projects', 'his work'],
    answer:
      'Five featured projects: SAKA (an AI DeFi agent, 2nd place at ETHGlobal Mumbai), Helios (a Kubernetes platform with self-checking releases), DockHealer (an AI Dockerfile generator that verifies its own output), PollForge (a five-service voting app on Azure Kubernetes) and SOM-Gold (ML research at UNSW Sydney).',
    sources: ['resume', 'gh-profile'],
    action: { type: 'goto', target: 'work' },
  },
  {
    id: 'awards',
    keys: ['awards', 'achievements', 'what has he won', 'hackathons', 'accomplishments', 'recognition'],
    answer:
      'Two hackathon wins: 2nd place in the 0G track at ETHGlobal Mumbai 2026 ($1,500) for SAKA, and 1st place in the Viral Consumer Apps track at LNMHacks 8.0 ($600 partner prize, 500+ participants). He is also second author on a research paper from UNSW Sydney, now under review.',
    sources: ['saka-showcase', 'resume', 'som-citation'],
    action: { type: 'goto', target: 'achievements' },
  },
  {
    id: 'phone',
    keys: ['phone', 'mobile number', 'call him', 'whatsapp', 'contact number'],
    answer: 'Email is the quickest way to reach him: ab262133@gmail.com. His full contact details are on the résumé PDF, which you can download from the résumé page.',
    sources: ['resume'],
    action: { type: 'goto', target: 'contact' },
  },
  {
    id: 'personal',
    keys: ['how old', 'his age', 'birthday', 'born', 'hobbies', 'free time', 'married', 'girlfriend', 'religion', 'salary'],
    answer:
      'That is personal and he hasn’t shared it on this site, so I won’t guess. I can tell you about his projects, internships, studies or hackathon wins.',
    sources: ['resume'],
  },
  {
    id: 'strengths',
    keys: ['why should we hire', 'why hire', 'strengths', 'strength', 'good engineer', 'is he good', 'is he any good', 'what makes him', 'stand out', 'unique about', 'impressive about him', 'why him'],
    answer:
      'Judge the evidence, not my opinion: he builds systems that check their own work. SAKA wraps an AI that moves money in deterministic safety checks (2nd at ETHGlobal Mumbai, 600+ tests). Helios rolls releases back on live metrics. At Finn he shipped to production (25+ merged PRs), and at UNSW he found the bug that took recall from 0% to 76.6%.',
    sources: ['saka-showcase', 'saka-repo', 'helios-repo', 'resume'],
    action: { type: 'goto', target: 'work' },
  },
  {
    id: 'team',
    keys: ['teamwork', 'team player', 'in a team', 'on a team', 'worked in a team', 'work in a team', 'collaborat*', 'work with others', 'solo projects'],
    answer:
      'Both. SAKA was a team hackathon entry (all 41 public commits are his), Finn meant shipping inside a production team where his 25+ pull requests were reviewed and merged, and SOM-Gold is a four-author research paper. Helios, DockHealer and PollForge are solo projects.',
    sources: ['saka-repo', 'resume', 'som-citation'],
  },
  {
    id: 'resume',
    keys: ['resume', 'résumé', 'cv', 'curriculum vitae'],
    answer: 'His résumé is on the résumé page (in the navigation), with his original PDF to download.',
    sources: ['resume'],
  },
  {
    id: 'helios-canary',
    keys: ['canary', 'canary release', 'canary deployment', 'progressive delivery'],
    answer:
      'A canary release sends a new version to a small share of users first and only rolls it out further if it behaves. In Helios each release goes to 25%, then 50%, 75% and 100%, and only advances while the live success rate stays at or above 95%; otherwise it rolls back by itself.',
    sources: ['helios-repo'],
    action: { type: 'goto', target: 'helios' },
  },
  {
    id: 'helios-gitops',
    keys: ['gitops', 'argocd', 'argo cd'],
    answer:
      'GitOps means the Git repository is the single source of truth: a tool (ArgoCD in Helios) keeps the cluster matching what is in Git and undoes manual drift. In Helios a git push is the whole deployment process: zero manual steps.',
    sources: ['helios-repo'],
    action: { type: 'goto', target: 'helios' },
  },
  {
    id: 'helios-operator',
    keys: ['operator', 'kubebuilder', 'custom resource', 'crd'],
    answer:
      'A Kubernetes operator is a small program that teaches the cluster a new kind of object. Ayush wrote one in Go for Helios: apply a 7-line PreviewEnvironment resource and it creates a private copy of the app for that pull request, then cleans everything up when it is deleted.',
    sources: ['helios-repo', 'helios-operator'],
    action: { type: 'goto', target: 'helios' },
  },
  {
    id: 'saka-mcp',
    keys: ['mcp', 'model context protocol', 'mcp server'],
    answer:
      'MCP (Model Context Protocol) is a standard way to give an AI model tools it can call. For SAKA he built a 16-tool Uniswap MCP server that can build transactions but never sign or send them, and a build test fails if anyone adds signing code.',
    sources: ['saka-repo', 'saka-mcp'],
    action: { type: 'goto', target: 'saka' },
  },
  {
    id: 'saka-autopilot',
    keys: ['autopilot', 'while i sleep', 'while you sleep', 'unprompted', 'on its own', 'telegram', 'automatically trade', 'detectors'],
    answer:
      'SAKA also works unprompted: nine detectors check every funded wallet each minute and, when something needs attention, propose an action you can approve, change or skip, in the app or on Telegram. Every proposal still goes through the same safety pipeline.',
    sources: ['saka-repo', 'saka-showcase'],
    action: { type: 'goto', target: 'saka' },
  },
  {
    id: 'saka-ethglobal',
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
    id: 'som-gold-unsw',
    keys: ['unsw', 'research', 'sydney', 'som', 'self-organizing', 'paper'],
    answer:
      'At UNSW Sydney (May–Aug 2026, remote) he worked with Dr. Rohitash Chandra on SOM-Gold, using self-organizing maps and autoencoders on hyperspectral satellite data for gold exploration. He fixed a training bug that raised mineral recall from 0% to 76.6%, corrected 8 pipeline bugs, and built the evaluation framework. He is second author on the paper, which is under review.',
    sources: ['resume', 'som-citation', 'som-repo'],
    action: { type: 'goto', target: 'som-gold' },
  },
  {
    id: 'backend',
    keys: ['backend', 'finn', 'airforge', 'production', 'apis', 'industry experience', 'pull request*', 'prs', 'merged', 'voice agent*'],
    answer:
      'At Finn (Airforge Tech, May–Jul 2026) he merged 25+ PRs across 5+ production services: AI voice agents, backend APIs, authentication, WhatsApp automation and deployment, with twice-weekly releases using Docker, Kubernetes and Nginx. In projects, SAKA has a Fastify API with a BullMQ worker, and PollForge is a five-service event-driven system.',
    sources: ['resume', 'saka-repo', 'pollforge-repo'],
    action: { type: 'goto', target: 'experience' },
  },
  {
    id: 'kubernetes',
    keys: ['kubernetes', 'k8s', 'devops', 'cloud', 'platform', 'aks', 'docker', 'kubernetes in production', 'running kubernetes', 'k8s in production', 'platform engineering', 'sre'],
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
    keys: ['contact', 'email', 'reach him', 'reach out', 'linkedin', 'get in touch'],
    answer: 'Email ab262133@gmail.com, or find him on LinkedIn and GitHub. The résumé is linked in the navigation.',
    sources: ['gh-profile', 'linkedin'],
    action: { type: 'goto', target: 'contact' },
  },
  {
    id: 'available',
    keys: ['is he available', 'available', 'availability', 'open to', 'looking for', 'hire him', 'hiring', 'full time', 'full-time', 'job offer', 'notice period'],
    answer:
      'He is looking for software engineering internships in backend, cloud/platform, AI/ML and AI agents, and graduates from LNMIIT in 2028. The fastest route is email: ab262133@gmail.com.',
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
