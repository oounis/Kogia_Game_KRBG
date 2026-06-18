# Game Feel & Juice - the addiction layer

> "Juice" = the animation, sound and feedback that make every action *feel* amazing. This is ~70% of what
> makes a simple game addictive. It is layered ON TOP of the pure rules engine (logic and feel stay separate).

---

## 1. The Combo System (the signature feel) - Othman's idea
**Insight:** Classic Kharbga's *mandatory chained capture* (one Soldier keeps moving and capturing in a single
turn - left, right, down...) is **secretly a fighting-game combo system.** Lean into it HARD - it's the game's
"wow" moment and its shareable highlight.

### How it escalates (Street-Fighter style, Roman flavour)
As a single Soldier chains captures in one turn, the feedback ramps up each hit:

| Captures in the chain | Announcer | Feedback |
|---|---|---|
| 1 | (silent) | flash + soft *thwack* + the piece flies off |
| 2 | **DOUBLE** | bigger flash, light screen-shake, pitch up, combo counter "x2" appears |
| 3 | **TRIPLE** | hit-pause (freeze 80ms), shake, particle burst, crowd "oh!" |
| 4 | **ONSLAUGHT** | slow-mo on the hit, heavier shake, gold sparks |
| 5+ | **ANNIHILATION** | full dramatic beat: time freezes, screen flash, big fanfare, "VENI VIDI VICI" banner |

### Ingredients (per hit in the chain)
- **Hit-pause / freeze-frame** - the screen freezes ~60-120ms on each capture. *This single trick is what makes
  fighting games feel punchy.* Cheap, huge impact.
- **Screen shake** - intensity scales with combo count.
- **Captured piece flies off** - arcs off the board with a spin + dust puff (don't just delete it).
- **Combo counter** - a rising "x2 / x3 / x4" in the corner with the announcer word.
- **Escalating sound** - each hit a semitone higher; the final hit a big stinger.
- **Slow-mo on the finisher** - the last capture of a 4+ chain plays in slow motion, then snaps back.
- **Mobile haptics** - a vibration tick per hit, a big buzz on the finisher.

> Result: a 4-capture chain becomes a 2-second mini-cinematic the player wants to repeat (and screen-record/share).

---

## 2. The Promotion Moment (7th capture -> Centurion) - a hero beat
When a Soldier lands its **7th capture** and is promoted, STOP everything and celebrate:
1. **Freeze** the board, dim everything except that Soldier.
2. The Soldier **glows, rises, and transforms** - a Centurion crest/helmet appears, gold light, rank-up flash.
3. A **"CENTURION!"** banner sweeps in with a triumphant fanfare + a strong haptic buzz.
4. ~1.2s, then resume - now the piece visibly slides differently (its new power is obvious).

> This is the player's biggest reward. Make it feel *earned and epic* - it's the carrot of the whole match.

---

## 3. Core juice checklist (every action feels good)
- **Move:** smooth slide tween (ease-out) + soft thud + a small dust kick on land. Never teleport.
- **Select:** selected piece lifts/glows; **legal-move dots** appear on reachable cells.
- **Capture:** flash + shake + sound + fly-off (see combos).
- **Last-move highlight** so the player can read what the AI just did.
- **Win:** victory fanfare, confetti/sand-burst, the winning line glows.
- **Lose:** a respectful defeat sting (not punishing) + instant **Rematch** button (the "one more" loop).
- **Sound design:** layered and satisfying; capture sounds escalate; ambient desert/cafe bed under it.
- **Haptics (mobile):** light tick on move, medium on capture, heavy on promotion/win.

## 4. Tech notes (HTML5 Canvas + TypeScript)
- Animations via `requestAnimationFrame` + a tiny tween/easing helper (or a 2KB lib).
- **Hit-pause** = pause the render/update loop for N ms on capture events.
- **Screen shake** = offset the canvas transform by a decaying random jitter.
- Sound via the **Web Audio API**; haptics via `navigator.vibrate` (wrapped by Capacitor on mobile).
- Combo/announcer + banners = a DOM/HTML overlay above the canvas (easier to style/animate than in-canvas text).
- **Keep it in a `juice/` layer** that listens to events from the rules engine - the engine itself stays pure
  and testable; remove the juice and the game still works headlessly (good for the AI).

## 5. Why this matters (the addiction link)
- The **combo** gives the *skill-expression highlight* (mastery feels great).
- The **promotion** gives the *escalating goal + reward* (dopamine ladder).
- **Hit-pause + shake + sound** give the *moment-to-moment satisfaction* (why you tap "one more").
Simple rules + this feel = simple, smart, and addictive. The rules are the skeleton; **juice is the dopamine.**
