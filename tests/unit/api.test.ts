import { describe, expect, it, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
});

const post = (body: unknown, headers: Record<string, string> = { 'content-type': 'application/json' }, ip = '1.2.3.4') =>
  new NextRequest('http://localhost/api/ask', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('/api/ask', () => {
  it('answers in clearly labelled offline mode without a model key', async () => {
    const { POST } = await import('@/app/api/ask/route');
    const res = await POST(post({ question: 'Who is Ayush?', context: { path: '/' } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body.mode).toBe('offline');
    expect(body.answer).toMatch(/Ayush/);
  });

  it('validates input', async () => {
    const { POST } = await import('@/app/api/ask/route');
    expect((await POST(post({ question: '' }))).status).toBe(400);
    expect((await POST(post({ question: 'x'.repeat(501) }))).status).toBe(400);
    expect((await POST(post({ question: 'hi', context: { path: 'javascript:alert(1)' } }))).status).toBe(400);
    expect((await POST(post({ question: 'hi', context: { path: '/', project: 'not-a-project' } }))).status).toBe(400);
    expect((await POST(post('{bad json'))).status).toBe(400);
    expect((await POST(post({ question: 'hi' }, { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await POST(post({ question: 'a'.repeat(9000) }))).status).toBe(413);
  });

  it('rate-limits a single visitor', async () => {
    const { POST } = await import('@/app/api/ask/route');
    const codes: number[] = [];
    for (let i = 0; i < 15; i++) codes.push((await POST(post({ question: 'Who is Ayush?' }, undefined, '9.9.9.9'))).status);
    expect(codes).toContain(429);
    expect(codes.filter((c) => c === 200).length).toBe(12);
  });

  it('reports the mode on GET', async () => {
    const { GET } = await import('@/app/api/ask/route');
    const body = await (await GET()).json();
    expect(body).toEqual({ mode: 'offline', provider: null, model: null });
  });
});
