import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { MODEL_OUTPUT_JSON_SCHEMA } from './schema';

export type GenerateInput = { system: string; user: string; signal: AbortSignal };
export type Provider = { name: 'anthropic' | 'gemini'; model: string; generate: (input: GenerateInput) => Promise<string | null> };

const MAX_OUTPUT = 2000;

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
  };
}

function geminiProvider(apiKey: string, model: string): Provider {
  const ai = new GoogleGenAI({ apiKey });
  return {
    name: 'gemini',
    model,
    async generate({ system, user, signal }) {
      const response = await ai.models.generateContent({
        model,
        contents: user,
        config: {
          systemInstruction: system,
          responseMimeType: 'application/json',
          responseJsonSchema: MODEL_OUTPUT_JSON_SCHEMA,
          maxOutputTokens: MAX_OUTPUT,
          abortSignal: signal,
        },
      });
      return response.text ?? null;
    },
  };
}

/**
 * Picks the configured provider. BYTE_PROVIDER forces one; otherwise Anthropic is used
 * when its key is present, then Gemini. No key → null → clearly labelled offline mode.
 */
export function getProvider(env: Record<string, string | undefined> = process.env): Provider | null {
  const forced = env.BYTE_PROVIDER?.toLowerCase();
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  const geminiKey = env.GEMINI_API_KEY?.trim();
  const anthropic = () => (anthropicKey ? anthropicProvider(anthropicKey, env.BYTE_MODEL?.trim() || 'claude-opus-5-5') : null);
  const gemini = () => (geminiKey ? geminiProvider(geminiKey, env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash') : null);
  if (forced === 'gemini') return gemini();
  if (forced === 'anthropic') return anthropic();
  if (forced === 'offline') return null;
  return anthropic() ?? gemini();
}
