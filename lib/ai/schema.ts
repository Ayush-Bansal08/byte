import { z } from 'zod';
import { PROJECTS } from '@/content/projects';
import { SOURCES } from '@/content/sources';

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug) as [string, ...string[]];
export const SECTION_IDS = ['top', 'achievements', 'work', 'experience', 'skills', 'about', 'contact'] as const;
export const GOTO_TARGETS = [...SECTION_IDS, ...PROJECT_SLUGS] as [string, ...string[]];
export const EMOTES = ['celebrate', 'think', 'wave', 'shrug'] as const;

export const MAX_QUESTION = 500;

export const AskRequest = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION),
  history: z
    .array(z.object({ role: z.enum(['user', 'byte']), text: z.string().max(900) }))
    .max(6)
    .default([]),
  context: z
    .object({
      path: z.string().max(120).regex(/^\/[a-z0-9\-/#]*$/i),
      project: z.enum(PROJECT_SLUGS).optional(),
      section: z.enum(SECTION_IDS).optional(),
    })
    .default({ path: '/' }),
});
export type AskRequest = z.infer<typeof AskRequest>;

export const ByteAction = z.union([
  z.object({ type: z.literal('goto'), target: z.enum(GOTO_TARGETS) }),
  z.object({ type: z.literal('emote'), name: z.enum(EMOTES) }),
]);
export type ByteAction = z.infer<typeof ByteAction>;

const SOURCE_IDS = SOURCES.map((s) => s.id) as [string, ...string[]];

/** What the model must return. Anything else is rejected and replaced by the offline answer. */
export const ModelOutput = z.object({
  answer: z.string().min(1).max(1200),
  found: z.boolean(),
  citations: z.array(z.enum(SOURCE_IDS)).max(4),
  action: z.enum(['none', ...GOTO_TARGETS.map((t) => `goto:${t}`), ...EMOTES.map((e) => `emote:${e}`)]),
});
export type ModelOutput = z.infer<typeof ModelOutput>;

export const MODEL_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'found', 'citations', 'action'],
  properties: {
    answer: { type: 'string', description: 'Concise answer, at most 90 words, plain text.' },
    found: { type: 'boolean', description: 'false when the evidence does not contain the answer' },
    citations: { type: 'array', items: { type: 'string', enum: SOURCE_IDS }, description: 'IDs of the evidence sources used' },
    action: {
      type: 'string',
      enum: ['none', ...GOTO_TARGETS.map((t) => `goto:${t}`), ...EMOTES.map((e) => `emote:${e}`)],
      description: 'Optional whitelisted UI action for the site guide',
    },
  },
} as const;

export type Citation = { id: string; title: string; url: string };
export type AskResponse = {
  answer: string;
  citations: Citation[];
  action: ByteAction | null;
  found: boolean;
  mode: 'ai' | 'offline';
  provider?: 'anthropic' | 'gemini';
  notice?: string;
  /** why the live model was skipped, e.g. 'model-not-found', 'quota', 'timeout' (no secrets) */
  fallbackReason?: string;
};
