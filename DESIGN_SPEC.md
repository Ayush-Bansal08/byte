# Design spec

**Intent:** an exceptional engineer's portfolio first, with one delightful character. Byte is the only playful element; everything else is calm, readable and fast.

## Tokens (`app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `bg` | `#0C1119` | Page |
| `surface` / `surface-2` | `#182332` / `#131C29` | Cards, bubbles |
| `text` | `#F4F7FC` | Primary text |
| `muted` / `faint` | `#A8B5C6` / `#8494A8` | Secondary text, metadata |
| `accent` | `#8CE5D0` | Byte's body, primary actions, links. Used sparingly so the eye finds Byte |
| `gold` | `#F2C14E` | Awards only (badges, crown, trophy) |
| `line` | `rgb(168 181 198 / .14)` | Hairlines |

**Project signature colours** (`tint` in `content/projects.ts`): SAKA `#B4A0FF` violet, Helios `#FFAD66` amber, DockHealer `#FF8FA3` rose, PollForge `#F08CF5` orchid, SOM-Gold `#F2C14E` gold. Used for a project's kicker, card hairline, hover glow and its case-study page.

Contrast: all text pairs pass WCAG AA (axe reports no contrast violations).

## Copy rules

- The headline says what kind of engineer, not which awards: "I build software that doesn’t take its own word for it."
- Every fact has one home on the homepage (awards in the trophy shelf, internship numbers in Experience, test counts on project cards). Nothing is repeated across sections.
- Byte never reads the page back. Its lines add an analogy, an opinion or a pointer to where to look.

## Type

Geist Sans for text, Geist Mono for kickers, chips, terminal UI. H1 2.6–4.2 rem, tight tracking (−0.035em); body 17 px / 1.65; kickers 12 px mono uppercase.

## Layout

- 1120 px container, 16 px gutters on phones, 32 px from 640 px.
- Home order: nav → hero (claim, proof sentence, CTAs, a "terminal" fact card) → recognition strip → work (SAKA feature + 2×2 grid) → experience timeline → skills by capability → about → contact.
- Case studies: 13 numbered blocks in a two-column grid (heading column with Byte's perch, content column).
- **Perches reserve space.** Byte stands on the bottom edge of an empty box placed where there is no text (right of headings, top of cards, under block headings). Bubbles open beside Byte inside that space, never under the fixed nav.

## Motion

- UI transitions: 150–200 ms, `cubic-bezier(.23,1,.32,1)`; buttons scale to .97 on press; chat panel uses a spring (Motion), loaded only when opened.
- Diagrams animate once when scrolled into view or when Byte inspects them; static otherwise.
- Effects layer (`app/globals.css`): hero colour field and dot grid, gradient ink on a few words, pointer-following glow on cards, a scroll-linked reading-progress bar, and a gradient border on the contact card that orbits on hover (desktop). The terminal card types itself in once.
- **Performance rule:** nothing loops forever and nothing repaints per frame. Looping cloud drift, scroll-driven reveals and an animated headline gradient were tried and removed after Lighthouse traces showed them costing up to seconds of main-thread time on phones. Phones get flat versions of masked or rotating layers.
- `prefers-reduced-motion`: CSS animations collapse; Byte switches to *static mode* (fades between perches, no walking/jumping/flips, no curtain).
