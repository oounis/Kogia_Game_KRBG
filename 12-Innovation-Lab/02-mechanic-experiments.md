# Mechanic Experiments - "Origins Mode"

Ideas to give Kharbga chess-like depth **without breaking its DNA** (grid, move + custodial capture, no luck).
Each is an opt-in experiment for `Origins Mode`. All names English/Roman. Ranked by impact-vs-effort.

> The flagship experiment - **the Centurion** (Othman's promotion idea) - has its own spec:
> [`experiment-01-the-centurion.md`](experiment-01-the-centurion.md). It directly fixes the boring midgame.

---

## TIER 1 - biggest impact (do these first)

### A. The Centurion (earned royal/slider) - see experiment 01
After **7 captures**, a Soldier is promoted to a **Centurion** that slides freely (like a chess rook).
Fixes the dead midgame, adds a goal and a focal high-value piece. **This is the priority experiment.**

### B. A few special pieces - *the chess "piece variety" idea*
Instead of 24 identical pieces, make ~3 special (rest stay normal Soldiers):
- **Cavalry** - may move 2 cells in a line, or jump one piece. Mobility = new tactics.
- **Guardian** - Soldiers adjacent to him **cannot be captured**. Defensive anchor.
- **Leader** - grants **one extra move** per turn while alive. Tempo.

### C. Fix the opening - *kill the boring placement*
Replace 24 manual drops with one of:
- **Preset formations:** choose from 3-4 named setups (like chess's fixed start). Fast, strategic.
- **Quick draft:** place only your special pieces; normal Soldiers auto-fill.

---

## TIER 2 - strong flavor (after Tier 1 plays well)

### D. The Citadel as a prize - *the Go "territory" idea*
- The center **Citadel** (and maybe 4 oasis tiles) become **scoring/holding zones**.
- Win condition variant: hold the Citadel for N turns, OR control more zones at timeout.
- Adds positional, Go-like contest over space - not just annihilation.

### E. Terrain tiles - *positional richness*
- **Dunes** (block movement), **Oasis** (a piece here can't be captured), **Gate** (only one passes).
- Turns the empty 7x7 into a tiny battlefield with chokepoints.

### F. Mandatory-capture as a weapon
- Classic already forces chained captures. Bait the opponent into a forced chain that walks their piece
  into YOUR trap (sacrifice tactics - like a chess combination).

---

## TIER 3 - modes & meta (replay value)
- **AI ladder:** The Kid -> The Merchant -> ... -> **The Emperor** (final boss). Difficulty = search depth + eval.
- **Daily puzzle:** "capture in 3" / "save your Centurion" - a reason to open the app every day.
- **Blitz mode:** a move timer adds adrenaline.
- **Ranked online** (Phase 4): ELO ladder, the real long-term retention.

---

## Design guardrails
- **Keep Classic pure.** All of the above is `Origins Mode` only.
- **Add few pieces, not many.** Start with the Centurion + at most 3 specials.
- **One new idea at a time -> playtest -> keep or cut.**
- **Never add luck/dice.** "No chance, pure mind" is the identity and selling point.

## Recommended first experiment
**Origins v0.1 = Classic rules + the Centurion (experiment 01) + preset formations (C).**
Smallest change that adds the most drama and removes the most tedium.
