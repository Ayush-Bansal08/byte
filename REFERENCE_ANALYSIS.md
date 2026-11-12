# Reference analysis

How the three references were studied, what was actually observed, and what was reproduced with original code and art.

## Method and limits

- **Meet A (yassineamraoui.com)**: inspected in a real Chromium browser with Playwright on 12–13 Nov 2026: frame sequences of the entrance (~150 ms apart), pointer moved to four corners, a scroll walk with screenshots before/after settling, 45 s of idling, a click into a case study (frames ~80–140 ms apart), browser back, a 375 px mobile session, a reduced-motion session and a JavaScript-disabled session. A DOM probe listed data attributes and fixed-position layers. The case study page (`/work/meet-a`) was read in full.
- **Not done**: no source code was extracted or reused; no artwork was copied. Frame captures are screenshots, not video, so sub-100 ms timing is approximate. Hover-only behaviours on other pages and the playground's per-skill demos were not exhaustively tested.
- **Brittany Chiang / Emil Kowalski**: used as principles (clarity, hierarchy; restrained, purposeful motion) rather than inspected frame by frame in this build. Stated here so it isn't overclaimed.

## Meet A: observed behaviours

| # | Behaviour | Trigger | What it does | Evidence |
|---|---|---|---|---|
| 1 | Emerges from the logo | Page load at top | The yellow stroke of the big hero "YA" monogram grows eyes (~0.9 s), smiles, pops out with arms out (~1.8 s), lands beside the name; the logo keeps a dashed outline where A was | Entrance frames 00–21 |
| 2 | Greeting with choices | After landing | Bubble types "Oh! Hi. You caught me." then an intro with two buttons ("Introduce him", "I'll look around") | Frames 15–39 |
| 3 | Expressions | Context | Dot eyes; happy `^^` eyes with blush; surprised "o" mouth; closed-eye sleep; strained `> <` while pulling the cloth | Zoomed frames |
| 4 | Follow spot | Scrolling | Mostly rides a fixed bottom-right spot while you scroll, speaking each section's line; jumps to in-section perches for some projects | Scroll frames |
| 5 | Section lines | Each section | Sections declare `data-scene`, `data-perch`, `data-pose`, `data-expr`, `data-line`, `data-head` / `data-hand` / `data-chest` | DOM probe |
| 6 | Costumes | Per project | Hard hat for the warehouse case, bow tie, pen/wrench in hand | DOM probe, case page frames |
| 7 | Sleep | ~25–45 s idle | Eyes close to arcs, grey "zzz" | idle-45s frame |
| 8 | Wake line | Pointer after sleep | Surprised face + "I wasn't sleeping. I was resting my eyes." | wake frame |
| 9 | Cloth transition | Clicking a case study | Dark cloth with a curved leading edge sweeps right→left, A at the edge in costume, destination title in outline type on the cloth; page swaps behind; A lands bottom-right in costume with a welcome line | Transition frames 00–29 |
| 10 | Draggable | Pointer | Hit area labelled "Press to ask something. You can also drag it." | DOM probe |
| 11 | Ask | Click | Quick-question chips ("Who is he?", "Best project?", "Is he available?"…) | User-supplied screenshot |
| 12 | Mobile | 375 px | Same entrance; bubbles at the top/bottom of the screen | Mobile frames |
| 13 | Reduced motion / no JS | Media query / JS off | Content intact; A painted in the logo | Screenshots, case study text |

**Weaknesses observed (and avoided here):** bubbles overlap the hero headline on desktop and body text on mobile; the follow spot sits on top of content.

## What Byte does instead (original)

| Reference idea | Byte's original version |
|---|---|
| Letter from the monogram | A terminal **block cursor** at the end of "Ayush Bansal" stands up: legs grow, eyes open on a dark face-plate, then a jump to the hero |
| Follow spot over content | **Perches that reserve layout space** in every section, card, experience role and case-study block, so Byte never covers text; plus **pointer-following** between side-by-side cards |
| Typed bubble | Bubble placed **beside** Byte inside the reserved space; never under the nav; long answers scroll inside it |
| Costumes per project | 12 hats/props, swapped at the apex of a **front flip** |
| Expressions | Rect "pixel" eyes, happy, star, heart, wink, focused, surprised, sleepy, closed; blush; mouths incl. talking |
| Pointing | A random **tool** (sword, wand, laser pointer, flag, magnifier, wrench) aimed along the arm at the exact element being explained |
| Cloth transition | A **terminal panel** hauled by Byte from floor level; the edge skews with speed; `$ cd ~/work/<project>` types out; page swaps behind it |
| Sleep | Drowsy nods → sits → closed eyes + floating z's → wakes with a startle and a joke |
| Ask | Click Byte for quick questions answered **inside the bubble** from verified notes or a model, with "Show me →" that runs the curtain to the evidence |
| — | Sound effects (Web Audio, quiet, muteable), a debug playground with live physics and the state machine |
