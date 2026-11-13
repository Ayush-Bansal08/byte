# Portfolio improvement report

Build and evaluation log for 12–13 Nov 2026. Everything below was observed in a real browser (Playwright/Chromium) against a production build, or measured by the tools named. Scores are my judgement against the brief, not tool output, except where a tool is cited.

## Passes

| Pass | Observed problem (evidence) | Fix |
|---|---|---|
| 1 | Mobile horizontal overflow 214 px (overflow probe) | Section headings could not wrap (`shrink-0`) → `min-w-0` |
| 1 | Greeting bubble overlapping the hero card (zoomed frame) | `rise-in` animation's final `transform` cancelled the bubble's `translateY(-100%)` → split wrapper/animated element |
| 1 | Byte ~60 px tall, little presence; entrance jump left the viewport | Larger Byte, lower first-jump apex |
| 2 | Byte floating ~16–20 px above surfaces | Perches measured before late layout shifts → re-measure poll + snap Byte to its perch |
| 2 | Mobile: Byte never left the logo (hero perch below the fold) | Mobile hero perch beside the kicker line |
| 2 | Tablet logo wrapping | Nav links from `lg`, `whitespace-nowrap` logo |
| 3 | Mobile Lighthouse 80–82, LCP 3.5 s, TBT 440–720 ms, favicon 404 | Logo state moved off `<html>` (whole-document restyle), Byte starts on idle after `load`, favicon added → LCP ~1.0 s, Best Practices 100 |
| 3 | CPU profile: Byte's attribute writer 527 ms self time; frames 50–120 ms under 4× throttle | CSS containment, cached attribute writes, lazy Byte runtime, delegated links instead of ~40 hydrated `<Link>`s |
| 4 | **Byte invisible** (computed opacity 0) after the caching change, missed by state-based tests | Opacity cache reset; e2e now asserts Byte is visible and in the viewport |
| 4 | Byte never visited DockHealer / SOM-Gold (side-by-side cards, same height) | Hops to the unvisited neighbour; pointer-following between cards |
| 4 | Quick-ask answers cut off under the fixed nav (user screenshot) | Bubbles clamp below the nav; long answers scroll inside; buttons stay visible |
| 4 | Byte's own lines overwrote the visitor's quick-ask bubble | Engagement hold while the visitor talks to Byte |
| 4 | Lines appeared ~3 s after landing; diagrams animated only on hover (user report) | Speak on landing then act it out; diagrams auto-play in view; shorter debounces |
| 5 | With Byte visible, mobile TBT 0.9–2.1 s (Lighthouse) | 0.1-unit quantised SVG writes, no drawing off-screen, 30 fps drawing on phones → mobile 86–92 |
| 5 | Possible stuck states (cancelled drags; long cooldowns looked like missing messages) | Drag-cancel handling, watchdog recovery, 2 s repeat cooldown |

| 6 | Live site on a phone: Byte's bubble squeezed into a ~100 px column, covering the headline and Byte (user screenshots) | Phones show Byte's lines in a card docked to the bottom of the screen; the page and Byte are never covered |
| 6 | Copy felt generic and repeated itself: ETHGlobal 2nd place appeared 5× on the homepage, 0% → 76.6% 4× (user feedback) | Every fact now has one home on the homepage; new headline and section titles; Byte's 70 lines rewritten per project and per block so it never reads the page back |
| 6 | Request for more colour and motion | Per-project signature colours, gradient headline, hero colour field and dot grid, pointer-following card glow, reading-progress bar, gradient-bordered contact card |
| 6 | The first version of those effects pushed mobile TBT to 3–11 s and desktop to 66–75 (Lighthouse traces): looping cloud drift, scroll-driven reveals and an animated gradient on the headline repainted every frame | Removed the looping and scroll-driven animations, made the gradient static, flattened costly layers on phones → desktop 99–100, mobile back to its previous range |
| 6 | Byte looked choppy mid-jump on phones (30 fps everywhere) | Full frame rate while Byte moves, 30 fps only while it stands still |
| 7 | No sound on phones (user report): audio unlocked only on the first `pointerdown`, which on touch screens is usually a scroll and is not a user gesture; effects peaked at 1–4% volume | Unlock retried on every tap/click/key until audio actually runs (with the silent-buffer trick for WebKit); levels ×3 behind a limiter; turning sound on plays a chirp |
| 7 | Byte felt slow on phones (user report). Measured at 4× CPU: line appeared ~0.17 s after landing; re-entries took ~0.55 s; decisions waited out the whole fling | Byte commits the instant scrolling stops (`scrollend`), 0.08 s debounce otherwise, snappier gravity (×1.27) and quicker off-screen re-entries (×1.5), line shown on the touchdown frame. Now: commits within ~0.1 s of scroll end, lands 0.45–0.73 s later, speaks on landing |
| 8 | Ask Byte slow, offline when the key failed, and unable to answer basics like "what is his name" (user screenshots) | Instant verified answers for common questions; live model gets the whole knowledge base with thinking off; circuit breaker falls back to notes instantly when the key fails; self-healing Gemini model choice; offline engine answers names, studies, location, skills ("does he know X?" from résumé and project stacks, honest when not), per-project how/role/results/bugs, strengths, teamwork and common terms; whole-word matching and page context that can't hijack unrelated questions. 29 real visitor questions are now a regression test |

Personality work driven by direct feedback: section moods (star, heart, wink…), 12 hats with front-flip swaps, random tools aimed at the subject, bouncier gait and landings, idle flourishes, in-bubble Q&A, "Show me" → curtain, quiet sound effects with a mute button.

## Reference comparison (Meet A)

| Behaviour | Meet A (observed) | Byte | Gap |
|---|---|---|---|
| Logo entrance | Stroke of the monogram pops out | Cursor stands up, grows legs, jumps | none |
| Walk | Short hops / walks | Distance-synced legs, footfall squash, arrival easing | none observed |
| Jump physics | Anticipation, squash/stretch | Analytic arcs, impact-scaled squash, flips on hat change | none observed |
| Eyes / blink / expressions | Dots, ^^, blush, o, closed | Pixel eyes + 9 expressions, blush, talking mouth | none |
| Sleep / wake line | Yes / yes | Yes / yes (3 lines) | none |
| Section lines | Fixed follow spot, overlaps text | Perches in every block, never covers text, speaks on landing | Byte is off-screen in long blocks without a perch (rare now) |
| Costumes | Per project | 12 hats, 7 tools | none |
| Cloth transition | Curved cloth, title on cloth | Terminal panel, skewing edge, typed `cd` | none observed |
| Drag | Yes | Yes | — |
| Ask | Chips, answers | Chips answered in-bubble + full chat with citations, optional LLM | — |
| Draw-the-logo playground demo | Yes | Physics/state-machine playground + AI decision demo | different, not equivalent |

## Test results (final run)

- `tsc --noEmit`: pass. `eslint .`: 0 errors, 0 warnings.
- Vitest: **106 / 106** pass (including 29 real visitor questions answered offline).
- Playwright: **40 / 40** pass (desktop + mobile projects), including axe WCAG 2.2 AA (no serious/critical violations on `/`, `/work/saka`, `/resume`, `/playground`).
- `next build`: pass; all pages static except `/api/ask`.

## Lighthouse (local production build, simulated throttling)

| Page | Device | Perf | A11y | Best pr. | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| `/` | desktop (2 runs) | 99, 100 | 100 | 100 | 100 | 0.3 s | 65–108 ms | 0 |
| `/` | mobile (2 runs) | 93, 84 | 100 | 100 | 100 | 0.9 s | 330–640 ms | 0 |
| `/work/saka` | mobile (2 runs) | 95, 79 | 100 | 100 | 100 | 0.9 s | 260–880 ms | 0 |

Measured after the pass-6 redesign. Mobile varies a lot between back-to-back runs on this laptop (the same build has scored 71–96); first runs are consistently 93–95. The 90+ mobile goal is met in some runs, not all.

## Scores (out of 10, my assessment)

| Category (weight) | Score | Why not higher |
|---|---|---|
| Animated character & interactivity (30%) | 9 | Physics/feel verified frame by frame and in tests; per-frame cost still notable on low-end phones |
| Recruiter clarity & content (25%) | 8.5 | Clear above the fold, verified everywhere; pending confirmations (paper status, team split, LNMHacks project) and About copy in your own voice |
| Visual design & typography (15%) | 8.5 | Clean, consistent; light theme not provided |
| AI assistant (10%) | 8 | Grounding, fallbacks and security tested; **live Claude/Gemini calls not exercised** (no key was used) |
| Mobile responsiveness (10%) | 8.5 | No overflow at 375/768, touch interactions tested; Byte draws at 30 fps on phones |
| Performance & accessibility (10%) | 8.5 | A11y 100 and axe-clean; mobile performance 86–92 |

## Known limitations

- No live LLM call was made (no key); the model path is covered by unit tests with fake providers. Add a key to `.env.local` and check `GET /api/ask` reports `mode: "ai"`.
- Rate limiting and the daily budget are in-memory per server instance; on serverless, also set a provider-side spend cap.
- Mobile Lighthouse varies 86–92 between runs.
- The résumé PDF is not in the repository yet (`public/resume.pdf`).
- Brittany Chiang and Emil Kowalski's sites were used as principles, not inspected frame by frame.
- Not deployed and not committed anywhere (by request).
