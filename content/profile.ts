import type { SourceId } from './sources';

export const PROFILE = {
  name: 'Ayush Bansal',
  role: 'Software engineer',
  headline: 'I build software that doesn’t take its own word for it.',
  /** Shown under the headline. Deliberately free of awards and employers: those have their own sections. */
  intro:
    'Third-year engineering student at LNMIIT, working across backend, cloud and AI agents. In everything below, the clever part never gets the last word. Something stubborn, measurable and deliberately boring does.',
  /** Factual one-paragraph bio for search previews, llms.txt and Ask Byte (not shown on the page). */
  summary:
    'Backend services, cloud platforms and AI agents. I placed 2nd in the 0G track at ETHGlobal Mumbai 2026 with SAKA, an autonomous DeFi agent, shipped production APIs and AI voice-agent features at Finn, and co-authored ML research at UNSW Sydney.',
  location: 'Gurgaon, India',
  education: {
    school: 'The LNM Institute of Information Technology (LNMIIT)',
    degree: 'B.Tech, Electronics and Communication Engineering',
    period: 'Aug 2024 – Jun 2028',
    place: 'Jaipur, India',
    sources: ['resume'] as SourceId[],
  },
  seeking: 'Software engineering internships in backend, cloud/platform, AI/ML and AI agents.',
  email: 'ab262133@gmail.com',
  links: {
    github: 'https://github.com/Ayush-Bansal08',
    linkedin: 'https://www.linkedin.com/in/ayush-bansal-21b12a311/',
    email: 'mailto:ab262133@gmail.com',
  },
  about: [
    'I like the parts of software that have to be right the first time: the queue that can’t drop a message, the agent that has to refuse a bad trade, the release that has to know when to back out.',
    'Clever components are easy to bolt on. I’m more interested in what happens when they’re wrong, so I design that part first: the exit condition, the check that can’t be argued with, the log that shows what actually happened.',
    'If a number goes on a slide, I want to be able to rebuild it from scratch on someone else’s machine. That habit started in research and now follows me into every repo.',
  ],
} as const;

export type Achievement = {
  id: string;
  title: string;
  detail: string;
  date: string;
  metric: string;
  href?: string;
  sources: SourceId[];
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ethglobal',
    title: 'ETHGlobal Mumbai 2026',
    metric: '2nd place',
    detail: '0G "Build with 0G Private Computer" track, $1,500 prize, for SAKA',
    date: 'Nov 2026',
    href: '/work/saka',
    sources: ['saka-showcase', 'resume'],
  },
  {
    id: 'lnmhacks',
    title: 'LNMHacks 8.0',
    metric: '1st place',
    detail: 'Viral Consumer Apps track, partner prize ($600), among 500+ participants',
    date: 'Jan 2026',
    sources: ['resume', 'gh-profile'],
  },
  {
    id: 'paper',
    title: 'Research paper, UNSW Sydney',
    metric: 'Co-author',
    detail: 'Second of four authors on the SOM-Gold paper, now with reviewers',
    date: 'May – Aug 2026',
    href: '/work/som-gold',
    sources: ['resume', 'som-citation'],
  },
];

export type Role = {
  id: string;
  company: string;
  title: string;
  period: string;
  place: string;
  summary: string;
  bullets: string[];
  stack: string[];
  link?: { label: string; href: string };
  sources: SourceId[];
};

export const EXPERIENCE: Role[] = [
  {
    id: 'finn',
    company: 'Finn (Airforge Tech Private Limited)',
    title: 'Software Engineering Intern',
    period: 'May 2026 – Jul 2026',
    place: 'Bengaluru, India',
    summary: 'Production engineering on a live AI product, where a bad deploy has real customers on the other end.',
    bullets: [
      'Merged 25+ pull requests across 5+ production services, including AI voice agents, backend APIs, authentication, WhatsApp automation, deployment infrastructure and customer-facing dashboards.',
      'Built LLM-powered agent workflows, backend services, REST APIs and event-driven workflows behind real-time conversational AI and enterprise customer interactions.',
      'Ran staging and production environments with twice-weekly deployments using Docker, Kubernetes, Nginx and CI/CD pipelines.',
    ],
    stack: ['LLM agents', 'REST APIs', 'Event-driven workflows', 'Docker', 'Kubernetes', 'Nginx', 'CI/CD'],
    sources: ['resume'],
  },
  {
    id: 'unsw',
    company: 'UNSW Sydney',
    title: 'AI/ML Research Intern, under Dr. Rohitash Chandra',
    period: 'May 2026 – Aug 2026',
    place: 'Sydney, Australia (remote)',
    summary: 'Turning a research pipeline nobody could reproduce into one anybody can.',
    bullets: [
      'Fixed a critical training bug that raised mineral recall from 0% to 76.6%; co-author of the SOM-Gold paper, currently under review.',
      "Audited the unsupervised ML pipeline and corrected 8 bugs, including an incorrect Cohen's κ, mismatched autoencoder data masks and unseeded PyTorch RNGs, and rebuilt an irreproducible ground-truth raster from a public government WFS API.",
      'Designed an evaluation framework with hyperparameter sweeps, McNemar significance tests, stability analysis and ablations, showing SOM outperforms k-means on the target geological unit across all metrics.',
    ],
    stack: ['PyTorch', 'Self-organizing maps', 'Autoencoders', 'Hyperspectral (EnMAP)', 'Statistical testing'],
    link: { label: 'Case study', href: '/work/som-gold' },
    sources: ['resume', 'som-repo', 'som-citation'],
  },
];

export type SkillGroup = { id: string; title: string; capability: string; items: string[]; evidence: { label: string; href: string }[] };

export const SKILLS: SkillGroup[] = [
  {
    id: 'backend',
    title: 'Backend and APIs',
    capability: 'Services, queues and data models that keep working when traffic or dependencies misbehave.',
    items: ['TypeScript / Node.js (Fastify, Express)', 'Python (Flask)', 'REST and WebSockets', 'BullMQ and Redis queues', 'PostgreSQL (Prisma), MongoDB'],
    evidence: [
      { label: 'SAKA', href: '/work/saka' },
      { label: 'PollForge', href: '/work/pollforge' },
      { label: 'Finn', href: '/#experience' },
    ],
  },
  {
    id: 'platform',
    title: 'Cloud and platform',
    capability: 'Infrastructure as code, GitOps and delivery pipelines that deploy and roll back on their own.',
    items: ['Kubernetes (AKS, k3s, kind) and a custom Go operator', 'Docker, Helm, Nginx, cert-manager', 'Terraform on Azure', 'GitHub Actions with OIDC, ArgoCD, Argo Rollouts'],
    evidence: [
      { label: 'Helios', href: '/work/helios' },
      { label: 'PollForge', href: '/work/pollforge' },
      { label: 'DockHealer', href: '/work/dockhealer' },
    ],
  },
  {
    id: 'reliability',
    title: 'Observability and security',
    capability: 'Measuring what a system does, and proving it under load, failure and attack.',
    items: ['Prometheus, Grafana, Loki', 'k6 load tests, Chaos Mesh', 'Trivy, Kyverno, Falco, least-privilege RBAC'],
    evidence: [{ label: 'Helios', href: '/work/helios' }],
  },
  {
    id: 'ai',
    title: 'AI agents and ML',
    capability: 'Agents with guardrails, plus evaluation that holds up to scrutiny.',
    items: ['LLM agents and MCP servers', 'Ollama, LangChain, Hugging Face', 'PyTorch, scikit-learn, SOMs, autoencoders', 'Evaluation: McNemar tests, Wilson intervals, ablations'],
    evidence: [
      { label: 'SAKA', href: '/work/saka' },
      { label: 'DockHealer', href: '/work/dockhealer' },
      { label: 'SOM-Gold', href: '/work/som-gold' },
    ],
  },
  {
    id: 'web3',
    title: 'Web3',
    capability: 'Agent wallets, DEX integrations and on-chain audit trails.',
    items: ['0G Router, Private Computer and Storage', 'Uniswap v4 and Trading API', 'Privy server wallets', 'Solidity with Foundry'],
    evidence: [
      { label: 'SAKA', href: '/work/saka' },
      { label: 'GitHub', href: 'https://github.com/Ayush-Bansal08?tab=repositories' },
    ],
  },
];

/** "Technical Skills" exactly as listed on the résumé (Nov 2026). Used to answer "does he know X?". */
export const RESUME_TECH: Record<string, string[]> = {
  Languages: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C/C++', 'C#', 'Bash', 'Go'],
  Technologies: ['React.js', 'Next.js', 'Node.js', 'Express.js', 'Flask', 'Git', 'GitHub', 'MongoDB', 'PostgreSQL', 'Redis', 'WebSockets', 'REST APIs', 'GCP', 'Postman', 'Inngest', 'HTML/CSS', 'pytest'],
  'AI/ML': ['LLMs', 'Ollama', 'NLP', 'LangChain', 'Hugging Face', 'FAISS', 'scikit-learn', 'NumPy', 'Pandas', 'PyTorch'],
  Web3: ['0G', 'Uniswap', 'Privy'],
  'DevOps and cloud': ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'CI/CD', 'Helm', 'Azure', 'AKS', 'ACR', 'VNet/NSG', 'Linux', 'Nginx', 'Prometheus', 'Grafana', 'cert-manager', 'Trivy', 'OIDC'],
};

export const LANGUAGES = ['Python', 'TypeScript', 'JavaScript', 'Go', 'Java', 'C / C++', 'C#', 'Bash'];
