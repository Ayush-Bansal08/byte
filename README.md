# Ayush Bansal: portfolio

A Next.js portfolio with **Byte**, an animated character that lives in the page: it climbs out of the logo cursor, follows you section by section (and to whichever card your pointer rests on), changes hats and moods, points at things with a random tool, falls asleep when ignored, drags a terminal "cloth" across the screen between pages, and answers questions about Ayush's work from verified sources.

Everything Byte does is hand-written SVG and TypeScript: a deterministic state machine, a fixed-step physics loop and a procedural rig. No video, no animation library for the character.

## Quick start

Requirements: Node.js 22.12+.

```bash
npm install
npm run dev            # http://localhost:3000
```

Production build:

```bash
npm run build
npm start              # http://localhost:3000
```

## Byte's AI (optional)

Byte works with **no key at all**: it answers from curated, verified notes and labels those answers "offline". To enable model answers, copy `.env.example` to `.env.local` and set **one** key:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini. Default model `gemini-3.6-flash` (override with `GEMINI_MODEL`). |
| `ANTHROPIC_API_KEY` | Anthropic Claude. Default model `claude-opus-5-5` (override with `BYTE_MODEL`; `claude-haiku-5-5` is much cheaper). Server-side refusal fallbacks are enabled. |
| `BYTE_PROVIDER` | Force `gemini`, `anthropic` or `offline` when more than one key is set. |
| `BYTE_DAILY_LIMIT` / `BYTE_RATE_LIMIT` | Spending guard (model calls per instance per day) and per-visitor rate limit. |

Keys are only read on the server (`app/api/ask/route.ts`); they are never sent to the browser. Never commit `.env.local`.

Whichever provider is used, answers stay grounded: the server retrieves evidence from the site's own content, the model must return schema-validated JSON, citations are filtered to the evidence actually provided, links are resolved server-side, and UI actions come from a whitelist. If the model is slow, fails, or returns anything invalid, Byte falls back to the curated answer and says so.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint (Next.js + React Compiler rules) |
| `npm test` | Vitest unit tests (engine physics, state machine, director, retrieval, API) |
| `npm run test:e2e` | Playwright browser tests incl. axe accessibility checks (builds must exist: run `npm run build` first) |
| `npm run check` | typecheck + lint + unit tests |

First Playwright run: `npx playwright install chromium`.

## Content

All facts live in `content/`:

- `content/sources.ts`: every evidence source (résumé, repos, showcase, demos). Byte can only cite IDs from here.
- `content/profile.ts`: profile, achievements, experience, skills.
- `content/projects.ts`: the five case studies (problem, architecture, decisions, testing, outcomes, limitations).

The pages, `llms.txt`, the sitemap and Byte's knowledge base (`lib/ai/knowledge.ts`) are all generated from these files, so updating a fact in one place updates it everywhere.

**Résumé PDF:** drop your PDF at `public/resume.pdf`. The `/resume` page shows a "Download PDF" button automatically when the file exists; until then it offers an HTML résumé with print-to-PDF.

## Where Byte stands

Any element can host Byte:

```tsx
<CharacterStage
  id="saka"
  behavior="inspect"      // greet | inspect | point | celebrate | wave | think | study | none
  costume="agent"         // none | agent | helmet | glasses | trophy | party | cap | headset | crown | detective | medic | beanie
  mood="focused"          // neutral | happy | star | heart | wink | focused | surprised
  lookAt="saka-pipeline"  // element id Byte points/looks at
  scene="saka-pipeline"   // event that page components can react to (e.g. a diagram lighting up)
  message="The AI only proposes. Deterministic checks decide."
  className="h-[112px] min-w-[84px] flex-1"  // the perch reserves real layout space
/>
```

The perch is an empty, `aria-hidden` box that reserves space, so Byte never covers text.

## Deploying (Vercel)

1. Push the repository to GitHub (not done by this build: your call).
2. Import it in Vercel; the defaults for Next.js work as is.
3. Add `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` (optional) and `NEXT_PUBLIC_SITE_URL` as environment variables.
4. Set a hard spending limit in your model provider's console as well; the in-app limiter is per server instance.

## Documentation

- `REFERENCE_ANALYSIS.md`: what was observed on the Meet A reference, and how.
- `CONTENT_AUDIT.md`: every claim, its source, and what needs your confirmation.
- `DESIGN_SPEC.md`, `ARCHITECTURE.md`, `CHARACTER_SPEC.md`: design and engineering.
- `PORTFOLIO_IMPROVEMENT_REPORT.md`: the evaluation-and-improvement passes, test results, scores and known limitations.
