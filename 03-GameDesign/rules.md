# Kharbga - Authoritative Rules Specification (v1.0, Classic Mode)

> Single source of truth for the **Classic** game engine. Verified against the Kharbga Game Network
> (kharbga.com) and southern-Tunisian (Tataouine) play. All names are English/Roman.
> Enhancements (e.g. the Centurion) live in **Origins Mode** - see `../12-Innovation-Lab/`.

## 1. Board & pieces
- **Board:** 7 x 7 grid = 49 squares.
- **Center square - the Citadel:** marked with a cross; **left empty during the placement phase**.
- **Pieces:** 24 Soldiers per player (48 total -> they fill every square except the Citadel).
- **Roles:** one **Attacker**, one **Defender**. Roles swap between games.

## 2. Phase 1 - Placement
- The **Attacker places first**, then players **alternate placing two (2) Soldiers per turn**.
- Continues until **all 48 non-center squares are full**; the Citadel stays empty.
- Placement is strategic: set up future captures and safe zones. No captures happen during placement.

## 3. Phase 2 - The first move
- The **Attacker always moves first**, and must move a Soldier **adjacent to the Citadel** (into the Citadel).
- This first move may capture **0 to 3** enemy Soldiers.
- **The Defender must be allowed at least one move.** If the Defender is completely blocked immediately
  after the Attacker's first move -> **Defender wins**.

## 4. Movement
- A Soldier may move only if **adjacent to an empty cell**.
- **Orthogonal only** - up / down / left / right. **No diagonal moves. No off-board moves.**
- One Soldier, one cell per turn - **unless a capture occurs** (see chained captures).

## 5. Capture - custodial
- A Soldier is captured when it becomes **sandwiched between two enemy Soldiers** on the same line
  (horizontal or vertical) **as a result of the opponent's move**.
- Up to **3 Soldiers** may be captured in a single move.

### 5.1 Safe-move exception
- A Soldier that **moves itself into the gap between two enemies is SAFE** (not captured).
- Capture only triggers when the **enemy closes the sandwich by moving**.

### 5.2 Chained / continued captures (mandatory)
- If a move results in a capture, **that same Soldier must keep moving** as long as further captures are
  possible. The turn ends only when no more captures are available from that Soldier.

## 6. The Exchange - Defender's 2-for-1 trade
For "untouchable" Soldiers the Attacker cannot reach, the Defender may trade **1 of theirs for 2 of the Attacker's**:
1. Defender flags an exchange request and moves the safe Soldier.
2. Attacker accepts and offers a first Soldier.
3. Defender confirms and takes the first Attacker Soldier.
4. Attacker offers a second Soldier.
5. Defender takes it; all three Soldiers are removed; the Attacker plays next.

## 7. Win / loss conditions
- **Defender wins** if blocked-out immediately after the Attacker's first move (rule 3).
- **Attacker wins** when all Defender Soldiers are captured/exchanged.
- **Defender wins** when all Attacker Soldiers are captured/exchanged.
- A player who is **blocked (no legal move)** loses; a player who **resigns** loses.

## 8. Variants
- **Kids' / quick mode:** 5 x 5 board, 12 Soldiers each, **no Exchange** rule.
- **Origins Mode:** Classic rules + experiments (the Centurion promotion, special pieces, formations).
  Documented and tuned in `../12-Innovation-Lab/`.

## 9. Engine implementation notes
- State = 7x7 grid of {empty | attacker | defender}, current phase, current player, capture counters.
- Pure functions: legalPlacements, legalMoves, applyMove, detectCaptures, mustContinueCapture, isBlocked, winner.
- Keep the rules engine **UI-independent** so it can be reused by the web game and the AI.
