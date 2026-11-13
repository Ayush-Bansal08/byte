import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { answerQuestion, buildUserPrompt, checkProvider, SYSTEM_PROMPT } from '@/lib/ai/answer';
import { retrieve } from '@/lib/ai/retrieve';
import { getProvider } from '@/lib/ai/providers';
import { RateLimiter } from '@/lib/ai/ratelimit';
import { AskRequest } from '@/lib/ai/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = new RateLimiter(
  Number(process.env.BYTE_RATE_LIMIT) || 12,
  10 * 60 * 1000,
  Number(process.env.BYTE_DAILY_LIMIT) || 300,
);
const MAX_BODY = 8 * 1024;

function visitorKey(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
  // hashed, kept in memory only for the rate-limit window; never logged or stored
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function POST(req: NextRequest) {
  const type = req.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) return json({ error: 'Expected JSON.' }, 415);
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX_BODY) return json({ error: 'Request too large.' }, 413);

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: 'Request too large.' }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }
  const parsed = AskRequest.safeParse(body);
  if (!parsed.success) return json({ error: 'Please ask a question of up to 500 characters.' }, 400);

  const rl = limiter.check(visitorKey(req));
  if (!rl.ok) {
    return json({ error: `You're asking faster than I can think. Try again in ${rl.retryAfter} seconds.` }, 429, { 'Retry-After': String(rl.retryAfter) });
  }

  const provider = getProvider();
  const allowModel = provider ? limiter.takeDaily() : true;
  const result = await answerQuestion(parsed.data, provider, { allowModel });
  return json(result);
}

/** What visitors will get right now: 'ai' only if the key actually works (verified, cached 10 min). */
let lastProbe = 0;

export async function GET(req?: NextRequest) {
  const provider = getProvider();
  // Diagnostics: ?probe=1 times one tiny real generation. Shows the model name, timing and a secret-free
  // reason; at most once a minute so it can't be used to burn the quota.
  const probe = req?.nextUrl.searchParams.get('probe');
  if ((probe === '1' || probe === 'full') && provider) {
    if (Date.now() - lastProbe < 60_000) return json({ error: 'Probe ran less than a minute ago.' }, 429);
    lastProbe = Date.now();
    const t = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      await provider.check();
      const checkMs = Date.now() - t;
      // 'full' sends a real visitor-sized request (system prompt + whole knowledge base)
      const q = AskRequest.parse({ question: 'Which of his projects would matter most to a team running Kubernetes in production, and why?', context: { path: '/' } });
      const input = probe === 'full'
        ? { system: SYSTEM_PROMPT, user: buildUserPrompt(q, retrieve(q.question, { k: 6 })) }
        : { system: 'Reply with JSON only.', user: 'Return {"answer":"ok","found":true,"citations":[],"action":"none"}' };
      const raw = await provider.generate({ ...input, signal: controller.signal });
      return json({ ok: Boolean(raw), provider: provider.name, model: provider.model, checkMs, generateMs: Date.now() - t - checkMs, promptChars: input.system.length + input.user.length, sample: probe === 'full' ? (raw ?? '').slice(0, 300) : undefined });
    } catch (err) {
      const status = (err as { status?: number }).status;
      return json({ ok: false, provider: provider.name, model: provider.model, ms: Date.now() - t, status: status ?? null, aborted: controller.signal.aborted, message: err instanceof Error ? err.message.replace(/key=[^&\s]+/gi, 'key=…').slice(0, 240) : 'error' });
    } finally {
      clearTimeout(timer);
    }
  }
  const status = await checkProvider(provider);
  return json({ mode: status.live ? 'ai' : 'offline', provider: provider?.name ?? null, model: provider?.model ?? null, ...(status.reason && provider ? { reason: status.reason } : {}) });
}
