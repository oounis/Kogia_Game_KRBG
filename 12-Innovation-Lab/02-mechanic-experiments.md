# Mechanic Experiments — "Origins Mode"

Ideas to give Kharbga chess-like depth **without breaking its DNA** (grid, move + custodial capture, no luck).
Each is an opt-in experiment for `Origins Mode`. Ranked by impact-vs-effort.

---

## ⭐ TIER 1 — biggest impact (do these first)

### A. The Sheikh (royal piece) — *the chess "king" idea*
- Each side has **one Sheikh** among its soldiers. **Capture the enemy Sheikh = instant win.**
- Adds a **focal target**, drama ("the Sheikh is threatened!"), and protect/attack tension.
- Keeps custodial capture (you still sandwich the Sheikh) — just makes ONE piece matter most.
- → This single change is the closest thing to "turn it into chess" while staying Kharbga.

### B. A few special soldiers — *the chess "piece variety" idea*
Instead of 24 identical pieces, make ~3–4 special (rest stay normal):
- **Faris / Knight (فارس)** — may move 2 cells in a line, or jump one piece. Mobility = new tactics.
- **Haris / Guardian (حارس)** — soldiers adjacent to him **cannot be captured**. Defensive anchor.
- **Qa'id / Leader (قائد)** — grants **one extra move** per turn while alive. Tempo.
- (These are your old "Fog" pieces — promote them from a hidden gimmick to a **core, visible roster**.)

### C. Fix the opening — *kill the boring placement*
Replace 24 manual drops with one of:
- **Preset formations:** choose from 3–4 historical/named setups (like chess's fixed start). Fast, strategic.
- **Quick draft:** place only your ~4 special pieces; normals auto-fill. Keeps agency, cuts tedium.
- Result: the game starts in the *fun* part (movement + capture) almost immediately.

---

## TIER 2 — strong flavor (after Tier 1 plays well)

### D. The Malha as a prize — *the Go "territory" idea*
- The center **Malha** (and maybe 4 oasis tiles) become **scoring/holding zones**.
- Win condition variant: hold the Malha for N turns, OR control more zones at timeout.
- Adds positional, Go-like contest over space — not just annihilation.

### E. Terrain tiles — *positional richness*
- **Dunes** (block movement), **Oasis** (a piece here can't be captured), **Ksar** (gate: only one passes).
- Turns the empty 7×7 into a tiny battlefield with chokepoints → deeper positional play.

### F. Mandatory-capture as a weapon
- Classic already forces chained captures. Lean into it: bait the AI/opponent into a forced chain that
  walks their piece into YOUR trap (sacrifice tactics — like a chess combination).

---

## TIER 3 — modes & meta (replay value, not core rules)
- **AI ladder:** The Kid → The Merchant → … → **Sheikh of Tataouine** (final boss). Difficulty = search depth + eval.
- **Daily puzzle:** "capture in 3" / "save your Sheikh" — a reason to open the app every day.
- **Blitz mode:** a move timer adds adrenaline (chess.com's biggest engagement driver).
- **Ranked online** (Phase 4): ELO ladder, the real long-term retention.

---

## Design guardrails (so we don't ruin it)
- **Keep Classic pure.** All of the above is `Origins Mode` only.
- **Add few pieces, not many.** Chess works with 6 types; don't go to 15. Start with Sheikh + 3 specials.
- **One new idea at a time → playtest → keep or cut.** Complexity is easy to add, hard to remove.
- **Never add luck/dice.** "No chance, pure mind" is Kharbga's identity and selling point.

## Recommended first experiment
**Origins v0.1 = Classic rules + the Sheikh (A) + preset formations (C).**
Smallest change that adds the most drama and removes the most tedium. Prototype this first.
