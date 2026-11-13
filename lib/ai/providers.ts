import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI, ThinkingLevel, type ThinkingConfig } from '@google/genai';
import { MODEL_OUTPUT_JSON_SCHEMA } from './schema';

export type GenerateInput = { system: string; user: string; signal: AbortSignal };
export type Provider = {
  name: 'anthropic' | 'gemini';
  model: string;
  generate: (input: GenerateInput) => Promise<string | null>;
  /** Cheap check that the key works and the model exists (no generation, no quota spent). Throws if not. */
  check: () => Promise<void>;
};

const MAX_OUTPUT = 2000;
const GEMINI_MAX_OUTPUT = 8192;

function anthropicProvider(apiKey: string, model: string): Provider {
  const client = new Anthropic({ apiKey, maxRetries: 1 });
  return {
    name: 'anthropic',
    model,
    async generate({ system, user, signal }) {
      const response = await client.beta.messages.create(
        {
          model,
          max_tokens: MAX_OUTPUT,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'low', format: { type: 'json_schema', schema: MODEL_OUTPUT_JSON_SCHEMA } },
          system,
          messages: [{ role: 'user', content: user }],
        },
        { signal, timeout: 15_000 },
      );
      if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') return null;
      return response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
    },
    async check() {
      await client.models.retrieve(model);
    },
  };
}

/** Newest general-purpose Flash model this key can call (skips image/audio/live/embedding variants). */
async function pickFlashModel(ai: GoogleGenAI, exclude: string[] = [], preferLite = false): Promise<string | null> {
  const found: string[] = [];
  const pager = await ai.models.list({ config: { pageSize: 100 } });
  for await (const m of pager) {
    const name = (m.name ?? '').replace(/^models\//, '');
    if (!/flash/i.test(name) || /(image|tts|audio|live|embed|vision|exp|8b)/i.test(name)) continue;
    if (m.supportedActions && !m.supportedActions.includes('generateContent')) continue;
    if (exclude.includes(name)) continue;
    found.push(name);
  }
  const version = (n: string) => Number(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  // newest version first; within a version prefer the stable name over -lite and -preview variants
  const variant = (n: string) => (/preview/.test(n) ? 2 : /lite/.test(n) ? (preferLite ? 0 : 1) : preferLite ? 1 : 0);
  found.sort((a, b) => version(b) - version(a) || variant(a) - variant(b));
  return found[0] ?? null;
}

function geminiProvider(apiKey: string, configured: string): Provider {
  const ai = new GoogleGenAI({ apiKey });
  let model = configured;
  let resolved = false;
  /** a second model for when the main one is overloaded; looked up once, then remembered */
  let backup: string | null | undefined;
  const getBackup = async () => {
    if (backup === undefined) backup = await pickFlashModel(ai, [model], true).catch(() => null);
    return backup;
  };
  // Speed: answers come from supplied evidence, so long "thinking" only adds seconds. Older Flash models
  // switch it off with a zero budget, newer ones take a level; we try the fastest form the model accepts.
  const THINKING: (ThinkingConfig | undefined)[] = [{ thinkingBudget: 0 }, { thinkingLevel: ThinkingLevel.MINIMAL }, { thinkingLevel: ThinkingLevel.LOW }, undefined];
  let thinking = 0;
  const once = (m: string, system: string, user: string, signal: AbortSignal) =>
    ai.models.generateContent({
      model: m,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseJsonSchema: MODEL_OUTPUT_JSON_SCHEMA,
        // thinking (when a model insists on some) counts against this budget: leave plenty of room
        maxOutputTokens: GEMINI_MAX_OUTPUT,
        ...(THINKING[thinking] ? { thinkingConfig: THINKING[thinking] } : {}),
        abortSignal: signal,
      },
    });
  const call = async (m: string, system: string, user: string, signal: AbortSignal) => {
    for (;;) {
      try {
        return await once(m, system, user, signal);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        // a thinking setting this model rejects: remember the next fastest one and retry
        if ((err as { status?: number }).status === 400 && /thinking/i.test(msg) && thinking < THINKING.length - 1) {
          thinking++;
          continue;
        }
        throw err;
      }
    }
  };
  const provider: Provider = {
    name: 'gemini',
    model,
    async generate({ system, user, signal }) {
      let response;
      try {
        response = await call(model, system, user, signal);
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 404 || (status === 400 && !resolved)) {
          // The configured name may not exist for this key: discover a working Flash model once, then retry.
          if (resolved) throw err;
          resolved = true;
          const next = await pickFlashModel(ai);
          if (!next || next === model) throw err;
          console.warn(`[ask] Gemini model "${model}" unavailable (${status}); using "${next}"`);
          model = provider.model = next;
          response = await call(model, system, user, signal);
        } else if (status === 503 || status === 500 || status === 502 || status === 504 || status === 429) {
          // Google's servers are busy (common on the free tier): answer from a backup Flash model straight
          // away instead of waiting on the busy one again.
          if (signal.aborted) throw err;
          const alt = await getBackup();
          if (!alt) throw err;
          console.warn(`[ask] Gemini "${model}" busy (${status}); answering with "${alt}"`);
          response = await call(alt, system, user, signal);
        } else {
          throw err;
        }
      }
      resolved = true;
      return response.text ?? null;
    },
    async check() {
      // listing models proves the key works; make sure the model we will call is one of them
      const pager = await ai.models.list({ config: { pageSize: 100 } });
      const names = new Set<string>();
      for await (const m of pager) names.add((m.name ?? '').replace(/^models\//, ''));
      if (!names.has(model)) {
        const next = await pickFlashModel(ai);
        if (!next) throw Object.assign(new Error('No Gemini Flash model available for this key'), { status: 404 });
        if (next !== model) console.warn(`[ask] Gemini model "${model}" unavailable; using "${next}"`);
        model = provider.model = next;
      }
      resolved = true;
    },
  };
  return provider;
}

/**
 * Picks the configured provider. BYTE_PROVIDER forces one; otherwise Anthropic is used
 * when its key is present, then Gemini. No key → null → clearly labelled offline mode.
 */
const cache = new Map<string, Provider>();
/** One provider per configuration, so a discovered model and its health survive between requests. */
function cached(key: string, make: () => Provider): Provider {
  let p = cache.get(key);
  if (!p) cache.set(key, (p = make()));
  return p;
}

export function getProvider(env: Record<string, string | undefined> = process.env): Provider | null {
  const forced = env.BYTE_PROVIDER?.toLowerCase();
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  const geminiKey = env.GEMINI_API_KEY?.trim();
  const anthropicModel = env.BYTE_MODEL?.trim() || 'claude-opus-5-5';
  const geminiModel = env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';
  const anthropic = () => (anthropicKey ? cached(`a:${anthropicKey}:${anthropicModel}`, () => anthropicProvider(anthropicKey, anthropicModel)) : null);
  const gemini = () => (geminiKey ? cached(`g:${geminiKey}:${geminiModel}`, () => geminiProvider(geminiKey, geminiModel)) : null);
  if (forced === 'gemini') return gemini();
  if (forced === 'anthropic') return anthropic();
  if (forced === 'offline') return null;
  return anthropic() ?? gemini();
}
