import type { SourceId } from './sources';

export const PROFILE = {
  name: 'Ayush Bansal',
  role: 'Software engineer',
  headline: 'I build backends and AI agents, then I try to break them.',
  /** Shown under the headline. Deliberately free of awards and employers: those have their own sections. */
  intro:
    'I’m a third-year student at LNMIIT. Most of my work lives behind the screen: APIs, queues, deploy pipelines, Kubernetes, and AI agents that are allowed to do real things. I spend as long on the ways they fail as on the happy path, and the write-ups below show both.',
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
  phone: '+91 99112 23788',
  links: {
    github: 'https://github.com/Ayush-Bansal08',
    linkedin: 'https://www.linkedin.com/in/ayush-bansal-21b12a311/',
    email: 'mailto:ab262133@gmail.com',
    phone: 'tel:+919911223788',
  },
  about: [
    'I’m based in Gurgaon and study electronics and communication engineering at LNMIIT, but most of my time goes into software. Backend work pulls me in because it’s where things break quietly: a message goes missing, a deploy stops halfway, a number looks right and isn’t.',
    'When I build something, I start by asking how it fails. What happens if the network drops, if the AI says something odd, if someone clicks twice? Those cases get tests before I call anything finished.',
    'Research at UNSW taught me to check numbers before I believe them. So every figure on this site has a link next to it, and you’re welcome to check mine.',
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
    summary: 'Shipping code to a live AI product with real customers on the other end.',
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
    summary: 'Took a research pipeline nobody could rerun and made it one anybody can.',
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
    capability: 'Services and queues that keep going when traffic spikes or something downstream falls over.',
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
    capability: 'Agents with hard limits on what they can do, and evaluation done with real statistics.',
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
