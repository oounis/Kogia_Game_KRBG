# Kharbga — Authoritative Rules Specification (v1.0)

> This is the single source of truth for the game engine. Verified against the Kharbga Game Network
> (kharbga.com) and southern-Tunisian (Tataouine) play. When building the engine, implement THIS document.

## 1. Board & pieces
- **Board:** 7 × 7 grid = 49 squares.
- **Center square — the *Malha* (المالحة):** marked with a cross; **left empty during the placement phase**.
- **Pieces:** 24 soldiers per player (48 total → they fill every square except the Malha).
- **Roles:** one **Attacker**, one **Defender**. Roles swap between games.

## 2. Phase 1 — Placement (التعمير)
- The **Attacker places first**, then players **alternate placing two (2) soldiers per turn**.
- Continues until **all 48 non-center squares are full**; the Malha stays empty.
- Placement is strategic: set up future captures and safe zones. No captures happen during placement.

## 3. Phase 2 — The first move
- The **Attacker always moves first**, and must move a soldier that is **adjacent to the Malha** (into the Malha).
- This first move may capture **0 to 3** enemy soldiers.
- **The Defender must be allowed at least one move.** If the Defender is completely blocked immediately
  after the Attacker's first move → **Defender wins**.

## 4. Movement
- A soldier may move only if **adjacent to an empty cell**.
- **Orthogonal only** — up / down / left / right. **No diagonal moves. No off-board moves.**
- One soldier, one cell per turn — **unless a capture occurs** (see chained captures).

## 5. Capture — custodial (الأكل / الحصار)
- A soldier is captured when it becomes **sandwiched between two enemy soldiers** on the same line
  (horizontal or vertical) **as a result of the opponent's move**.
- Up to **3 soldiers** may be captured in a single move.
- Captured soldiers are removed; the owner's count drops accordingly.

### 5.1 Safe-move exception
- A soldier that **moves itself into the gap between two enemies is SAFE** (not captured).
- A soldier already sandwiched at the end of *placement* is also safe.
- Capture only triggers when the **enemy closes the sandwich by moving**.

### 5.2 Chained / continued captures (إجباري — mandatory)
- If a move results in a capture, **that same soldier must keep moving** as long as further captures
  are possible. The turn ends only when no more captures are available from that soldier.

## 6. Al-Haf exchange (الحاف) — Defender's 2-for-1 trade
For "untouchable" soldiers the Attacker cannot reach, the Defender may trade **1 of theirs for 2 of the Attacker's**:
1. Defender flags an exchange request and moves the safe soldier.
2. Attacker accepts and offers a first soldier.
3. Defender confirms and takes the first Attacker soldier.
4. Attacker offers a second soldier.
5. Defender takes it; all three soldiers are removed; the Attacker plays next.

## 7. Win / loss conditions
- **Defender wins** if blocked-out immediately after the Attacker's first move (rule §3).
- **Attacker wins** when all Defender soldiers are captured/exchanged.
- **Defender wins** when all Attacker soldiers are captured/exchanged.
- A player who is **blocked (no legal move)** loses; a player who **resigns** loses.

## 8. Variants (for later)
- **Kids' / quick mode:** 5 × 5 board, 12 soldiers each, **no Al-Haf** rule.
- **Fog Mode (original to this game, Phase 5):** each player secretly designates 3 special soldiers —
  *Knight* (الفارس, moves diagonally once revealed), *Leader* (القائد, grants one extra move),
  *Guardian* (الحارس, shields adjacent soldiers from capture). Adds bluffing. ⚠️ The Knight's diagonal
  move breaks the orthogonal-only core rule — must be designed carefully as an opt-in mode.

## 9. Engine implementation notes
- State = 7×7 grid of {empty | attacker | defender}, current phase, current player, capture counters.
- Pure functions: `legalPlacements()`, `legalMoves(square)`, `applyMove()`, `detectCaptures()`,
  `mustContinueCapture()`, `isBlocked(player)`, `winner()`.
- Keep the rules engine **UI-independent** so it can be reused by the web game and the AI.
