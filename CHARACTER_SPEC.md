# Byte: character spec

## Design

A terminal **block cursor** that became a character. Rounded mint body (30 × 36 rig units), a dark "screen" face-plate with pixel eyes and a blinking `_` prompt, thin legs with feet, thin two-segment arms. Mint (`#8CE5D0`) is reserved for Byte so the eye finds it. Recognisable at 24 px (it is the favicon).

**Expressions:** neutral (pixel eyes), happy (^ ^), star (★ ★), heart (♥ ♥), wink, focused (narrowed), surprised, sleepy, closed, wince; blush on warm moods. **Mouths:** smile, grin, o, flat, talking (animated), thinking dots.

**Hats/props (12):** none, agent antenna, hard hat, glasses, trophy (held), party hat, graduation cap, headset, crown, detective hat, medic cap, beanie.

**Tools (7, chosen at random):** sword, wand, laser pointer, flag (pointing); magnifier, wrench (inspecting); mug (idle). Drawn along the forearm and aimed at the target element.

## Layers

| Layer | File | Responsibility |
|---|---|---|
| State machine | `lib/byte/machine.ts` | 21 states, explicit legal transitions, history; illegal moves are rejected, never half-applied |
| Engine | `lib/byte/engine.ts` | Fixed-step (1/120 s) physics, springs, blink scheduler, eye targeting, action queue gated by the machine |
| Actions | `lib/byte/engine.ts` | `walkTo, jumpTo, turn, wave, point, inspect, think, speak, celebrate, lookAround, shiftWeight, stretch, flourish, doze, wake, emerge, retract, fadeTo, setCostume, dragged, driven` |
| Rig | `lib/byte/rig.ts` | Pure pose from engine state: hip height, squash/stretch, two-bone legs with knees, arm chains, eye offsets, tool angle |
| Renderer | `components/byte/ByteFigure.tsx` | One SVG; per frame it only patches changed attributes |
| Director | `lib/byte/director.ts` | Decides *what* to do: perch routing, arrival behaviour, idle variety, sleep, chat reactions, engagement, watchdog |
| Layer | `components/byte/ByteLayer.tsx` | DOM wiring: measuring perches, scroll and pointer, bubbles, sounds, drag, routes, transitions |

## States

`HIDDEN, ENTERING, IDLE, LOOKING, WALKING, TURNING, JUMPING, LANDING, RECOVERING, WAVING, POINTING, INSPECTING, THINKING, SPEAKING, CELEBRATING, DROWSY, SLEEPING, WAKING, DRAGGED, EXITING, TRANSITIONING`.
Examples of rules: no waving mid-air (`JUMPING → LANDING | HIDDEN | DRAGGED` only); sleep only via `DROWSY`; `SLEEPING` only to `WAKING`.

## Motion

- **Walk:** accel-limited arrival steering (no overshoot); leg phase advances with distance travelled (π per stride), so feet never slide; body bob; a squash pulse at every footfall; lean into acceleration; feet settle together when stopping.
- **Jump:** 120 ms crouch (squash .78) → analytic ballistic arc that lands exactly on target → stretch with vertical speed → touchdown squash proportional to impact → spring recovery with jiggle. Non-interruptible mid-air. Hat changes trigger a **front flip**, swapping at the apex with a sparkle.
- **Turn:** body width springs through ~55% (reads as rotation); eyes lead the turn.
- **Eyes:** follow the pointer with `tanh` falloff, clamped to ±2.6/±1.8 units; random saccades when the pointer is still; blinks every 2.2–6.2 s, 18% double-blinks.
- **Idle (non-repeating, weighted):** look around, shift weight, face the visitor, blink, hop, happy double-bounce, pace the perch, glance/inspect, stretch, flourish a tool, visit the neighbouring card.
- **Sleep:** after 32 s without input: drowsy nods → sits, eyes close, z's float → any input wakes it with a startle and a joke.
- **Scroll:** looks in the scroll direction; fast scrolls make it hold its hat (arms up, surprised).

## Following the visitor

- Every section, project card, experience role and case-study block declares a perch (`CharacterStage`).
- **Scroll:** the perch nearest the reading line (45% of the viewport) becomes the target after 120 ms of stability.
- **Pointer:** resting the pointer on a card for 150 ms summons Byte to that card's perch (smallest containing card wins). Ignored inside the chat, bubbles and nav.
- **Side-by-side cards:** after presenting one card, Byte hops to its unvisited neighbour.
- **Off-screen trips:** Byte re-enters from the viewport edge nearest its old position (drops from the top or leaps up from below).
- **On landing:** the section's line appears immediately; Byte then acts it out (point/inspect with a tool, wave, celebrate) and fires the section's *scene* event (e.g. lights up the SAKA pipeline).
- **What it says:** each project has its own set of lines (`byte` in `content/projects.ts`): one for the home card and one per case-study block. Rule: never read the page back; add an analogy, an opinion or a pointer instead.
- **Where it says it:** on wide screens, in a bubble beside Byte inside its perch. On phones (< 640 px), in a card docked to the bottom of the screen with a dismiss button, so the page and Byte are never covered.

## Interaction

- **Click/tap:** a little hop and a quick-question bubble (context-aware), answered inside the bubble with "Show me →" (curtain to the evidence), "Ask more" (full chat), "Thanks!". While this bubble is open, Byte holds still and stays quiet.
- **Drag:** Byte dangles and protests; on release (or a cancelled drag) it hops back to its perch.
- **Chat:** opening turns Byte toward the panel; waiting = `THINKING`; answers = `SPEAKING`; no answer = neutral shrug.
- **Toggle:** the nav switch sends Byte back into the logo (reverse emergence) and persists.

## Page transitions

Byte hauls a terminal panel across the screen from floor level (cover 560 ms, reveal 540 ms). The panel edge skews with speed; the destination is typed as `$ cd ~/work/<slug>` and printed large. Navigation happens behind the cover (prefetched); the scroll position is settled instantly before the reveal. Interruptible with Escape; back/forward bypass it; a fail-safe timer always clears it; disabled for reduced motion or when Byte is off.

## Sound

Web Audio synthesis, peak gain ≤ 0.09 × 0.5 master: land (boop), jump (whoosh), pop (hat change), blip (bubble), shing (sword/wand), chirp (wake), sparkle (celebrate), swoosh (curtain). Starts after the first click/key (autoplay rules); mute button in the nav, remembered.

## Accessibility

Byte is `aria-hidden` decoration; everything it says is also on the page, and "Ask Byte" in the nav is the accessible path to the chat. Reduced motion → static mode. No focus traps; the hit area is not in the tab order. Without JavaScript a static Byte is painted in the hero.

## Frame rate

Physics always steps at 120 Hz with interpolated drawing. Desktop draws every frame. Phones draw every frame while Byte moves (entering, walking, turning, jumping, landing, celebrating, dragged, transitions) and at 30 fps while it stands still. Nothing is drawn while Byte is off-screen.

## Robustness

Watchdog: any action state lasting > 10 s (other than sleep/thinking-for-chat) resets Byte to idle and re-arrives. Stuck drags are released on `pointercancel` / `lostpointercapture`. Relocation flags self-heal when a plan is replaced. All loops, observers, listeners and timers are cleaned up on unmount.
