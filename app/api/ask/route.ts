import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { answerQuestion } from '@/lib/ai/answer';
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

export function GET() {
  const provider = getProvider();
  return json({ mode: provider ? 'ai' : 'offline', provider: provider?.name ?? null });
}
