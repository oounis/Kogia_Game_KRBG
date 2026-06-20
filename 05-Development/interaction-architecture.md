# Kharbga: Origins — Interaction Architecture (the website IS the tutorial)

Goal: a **playable learning experience**, not a marketing page. The user learns by touching, rotating,
zooming, moving pieces, making mistakes, and getting feedback. The tutorial is the product.

## The 8 systems (decoupled)
1. **StateMachine** — `idle → selecting → moving → validating → feedback → (next | reset)`. One source of truth.
2. **CameraController** — orbit (pointer drag), zoom (wheel / pinch), damped; spherical coords clamped; focus-on-cell.
3. **BoardController** — builds the 7×7 grid, owns cells, screen↔cell raycast, cell highlights.
4. **PieceController** — piece model `{id, side, c, r, mesh}`; select, move, capture, animate.
5. **RulesEngine** — pure: `legalMoves()`, `detectCaptures()` (custodial sandwich), `isBlocked()`, `isWin()`. UI-independent (reused by the real game + AI later).
6. **TutorialEngine** — `scenarios[]`, each `{title, instr, setup(), validate(move)→{ok,msg,done}}`. Drives the 4 lessons.
7. **AnimationEngine** — tweens moves/captures each frame; only triggered by user actions (no autoplay).
8. **Hint/ReplayEngine** — glow legal cells on select; "show me" suggests a move; replay last move; reset.

## The 4 tutorials (interactive — no video/gif/autoplay)
1. **Moves** — select a piece, see legal cells glow, move it orthogonally. Mistakes rejected with feedback.
2. **Captures** — set up a sandwich; move to capture; chained captures.
3. **Winning** — reach a win/block state; understand the goal.
4. **Strategy** — a small sandbox: free play vs a simple heuristic, with hints.

## The 7-section experience (interaction in every section)
1. Enter the Desert (cinematic entrance) → 2. Discover Kharbga (interactive timeline) →
3. Touch the Board (rotate/zoom a real 3D board) → 4. Learn by Playing (the 4 tutorials) →
5. Master the Battlefield (strategy sandbox) → 6. Explore Variants (regional rules) → 7. Join the Revival.

## Tech
Vanilla **Three.js** (core, no build) + custom orbit/zoom + raycast + a tiny state machine + the engines above.
Keeps "open index.html" + free GitHub Pages deploy. (R3F/Zustand/XState optional later, needs a Vite build.)

## Build order
P1 interactive board + Tutorial 1 (Moves) ✅ first → P2 Tutorial 2 (Captures) → P3 win/strategy →
P4 rebuild the page sections around interaction.
