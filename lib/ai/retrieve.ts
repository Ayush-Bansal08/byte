import { CHUNKS, FAQ, type Chunk, type Faq } from './knowledge';
import { PROJECTS } from '@/content/projects';

const STOP = new Set(
  'a an the is are was were be been of to in on for and or with what who how why does do did his he him it this that these those about me tell can you your i at as by from has have had which there their they show give know any'.split(' '),
);

const SYNONYMS: Record<string, string[]> = {
  k8s: ['kubernetes'],
  kube: ['kubernetes'],
  devops: ['kubernetes', 'ci', 'docker'],
  sre: ['kubernetes', 'prometheus', 'reliability'],
  hackathon: ['ethglobal', 'lnmhacks', 'achievement'],
  hackathons: ['ethglobal', 'lnmhacks', 'achievement'],
  won: ['achievement', 'place', 'prize'],
  win: ['achievement', 'place', 'prize'],
  internship: ['experience', 'intern'],
  internships: ['experience', 'intern'],
  job: ['experience'],
  research: ['unsw', 'som'],
  ml: ['unsw', 'som', 'pytorch'],
  ai: ['agent', 'llm'],
  agent: ['saka', 'llm'],
  defi: ['saka', 'uniswap'],
  web3: ['saka', '0g', 'uniswap', 'solidity'],
  blockchain: ['saka', '0g', 'solidity'],
  cv: ['resume', 'contact'],
  hire: ['contact', 'email'],
  backend: ['api', 'fastify', 'finn', 'service'],
  cloud: ['azure', 'kubernetes', 'terraform'],
};

export function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9.+#\s-]/g, ' ')
    .split(/[\s.-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
  const out: string[] = [];
  for (const t of raw) {
    out.push(t);
    const syn = SYNONYMS[t];
    if (syn) out.push(...syn);
  }
  return out;
}

type Indexed = { chunk: Chunk; tf: Map<string, number>; len: number };
const INDEX: Indexed[] = CHUNKS.map((chunk) => {
  const toks = tokenize(`${chunk.title} ${chunk.title} ${chunk.text} ${chunk.tags.join(' ')}`);
  const tf = new Map<string, number>();
  toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
  return { chunk, tf, len: toks.length };
});
const AVG = INDEX.reduce((s, d) => s + d.len, 0) / INDEX.length;
const DF = new Map<string, number>();
INDEX.forEach((d) => d.tf.forEach((_v, t) => DF.set(t, (DF.get(t) ?? 0) + 1)));

const PROJECT_NAMES = new Map(PROJECTS.map((p) => [p.slug, p.name]));

/** Pronoun-only questions ("how does this work?") are resolved to the project being viewed. */
export function resolveQuery(question: string, project?: string): string {
  if (!project) return question;
  const name = PROJECT_NAMES.get(project);
  if (!name) return question;
  const mentionsProject = [...PROJECT_NAMES.values()].some((n) => question.toLowerCase().includes(n.toLowerCase()));
  if (mentionsProject) return question;
  if (/\b(this|it|that|here|project|its)\b/i.test(question) || question.trim().split(/\s+/).length < 6) return `${question} ${name}`;
  return question;
}

export type Hit = { chunk: Chunk; score: number };

export function retrieve(question: string, opts: { project?: string; k?: number } = {}): Hit[] {
  const q = tokenize(resolveQuery(question, opts.project));
  if (!q.length) return [];
  const k1 = 1.3;
  const b = 0.72;
  const N = INDEX.length;
  const hits: Hit[] = INDEX.map(({ chunk, tf, len }) => {
    let score = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      const df = DF.get(t) ?? 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * len) / AVG)));
    }
    if (opts.project && chunk.project === opts.project) score *= 1.35;
    return { chunk, score };
  });
  return hits
    .filter((h) => h.score > 0.8)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, opts.k ?? 6);
}

/** Project names a visitor might type. A question naming one is about that project, not a general topic. */
const NAMED_PROJECTS: [string, RegExp][] = [
  ['saka', /\bsaka\b/],
  ['helios', /\bhelios\b/],
  ['dockhealer', /\bdock ?healer\b/],
  ['pollforge', /\bpoll ?forge\b/],
  ['som-gold', /\bsom(?:[- ]?gold)?\b/],
];

export function matchFaq(question: string, project?: string): { faq: Faq; score: number } | null {
  const q = ` ${resolveQuery(question, project).toLowerCase()} `;
  const named = NAMED_PROJECTS.filter(([, re]) => re.test(question.toLowerCase())).map(([slug]) => slug);
  let best: { faq: Faq; score: number } | null = null;
  for (const faq of FAQ) {
    // "What makes DockHealer different…" must not get the general Docker/Kubernetes answer
    if (named.length && !named.some((slug) => faq.id === slug || faq.id.startsWith(`${slug}-`))) continue;
    let score = 0;
    for (const key of faq.keys) if (q.includes(key)) score = Math.max(score, key.split(' ').length + 1);
    if (score && (!best || score > best.score)) best = { faq, score };
  }
  return best;
}
