# Architecture

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9, Tailwind CSS 4, Motion 14 (chat panel only), Zod 4, `@anthropic-ai/sdk` and `@google/genai` (server only), Vitest 5, Playwright 1.65 + axe-core.

## Rendering

All pages are statically prerendered (`/`, `/work/[slug]` ×5, `/resume`, `/playground`, `llms.txt`, sitemap, robots). Only `/api/ask` is dynamic. Content is complete without JavaScript; Byte and the chat are progressive enhancements:

- `ByteLayer` is loaded with `next/dynamic` after hydration and starts on `requestIdleCallback` after `load`.
- The chat panel (and Motion) load only when opened.
- Internal links are plain `<a>` elements; one delegated listener in `TransitionProvider` handles curtain transitions, client navigation and hover prefetch (no per-link hydration).

```
app/
  layout.tsx                 fonts, metadata, JSON-LD, providers, nav, footer, Byte, chat
  page.tsx                   home (components/home/Sections.tsx)
  work/[slug]/page.tsx       case studies (13 blocks, perch per block)
  resume/  playground/  api/ask/  llms.txt/  sitemap.ts  robots.ts  not-found.tsx
components/
  byte/      ByteContext, ByteLayer(+Lazy), ByteFigure (SVG renderer), CharacterStage (perch)
  transition/TransitionProvider (curtain, delegated links), TransitionLink (<a>)
  chat/      ChatDock (lazy), ChatPanel
  diagrams/  SceneFlow, ProjectVisual (react to Byte's scene events and to scrolling into view)
  home/ site/ playground/
lib/byte/    machine, engine (+actions), rig, director, math, sound
lib/ai/      knowledge, retrieve, answer, providers, schema, ratelimit
content/     sources, profile, projects  (single source of truth)
```

## Byte runtime (see CHARACTER_SPEC.md)

`ByteLayer` owns one `ByteEngine` and one `ByteDirector`. A `requestAnimationFrame` loop advances physics at a fixed 120 Hz and renders an interpolated pose. Byte lives in **document space** (absolutely positioned), so it scrolls with content natively: no per-scroll repositioning, no jitter. Perches are measured with `getBoundingClientRect` on load, resize, and a 1.2 s poll (layout can shift without resizing the body).

Performance measures: CSS containment on the layer and figure; cached attribute writes with 0.1-unit quantisation; no drawing while off-screen; 30 fps drawing on phones (physics stays 120 Hz); state exposed as data attributes only when it changes.

## Ask Byte (AI)

```
browser ── POST /api/ask {question, history≤6, context{path, project?, section?}}
            │ zod validation · 8 KB body cap · 500-char question · per-visitor sliding window
            ▼
        injection guard ──► fixed scope reply (never reaches a model)
            ▼
        BM25 retrieval over content-derived chunks (+ project boost for "this/it")
            ▼
   provider? ── none / daily budget spent ──► curated offline answer (labelled)
            ▼
   Claude or Gemini · system prompt (evidence-only, third person, cite IDs)
   · evidence fenced, visitor text fenced and tag-stripped · JSON schema output
            ▼
   zod-validate output · citations ∩ retrieved evidence · URLs resolved server-side
   · action ∈ whitelist (goto:section|project, emote:*) · 14 s timeout → offline fallback
```

- Page/project context is a retrieval hint only, never evidence.
- No conversation logging; IPs are hashed in memory for the rate-limit window only.
- The model cannot execute anything; actions are a validated whitelist mapped to scroll/curtain/emote.

## Testing

- **Unit (Vitest, 53):** state machine legality; walking (exact arrival, no overshoot, accel/decel, foot-synced stride); jumps (anticipation squash, stretch, exact landing, non-interruptible, flips with costume swap); blinking; sleep/wake; director routing, re-entry, side-by-side cards, speaking on landing, watchdog recovery, chat states, static mode; retrieval, offline answers, injection, provider selection, model-path validation/timeouts/budget; API validation, rate limiting.
- **Browser (Playwright, 40):** content and navigation, five case studies, 404, no-JS; Byte entrance (and actual visibility), costumes on scroll, pointer-following between cards, toggle persistence, reduced motion, dragging; curtain, back/forward, Escape, modified clicks; chat answers, citations, "this" context, injection, server errors, rate limits, "Show me" curtain flows; quick-ask bubble and nav-overlap guard; playground; axe WCAG 2.2 AA on four pages; keyboard skip link; mobile menu, overflow, tap; screenshots at 375/768/1440.
