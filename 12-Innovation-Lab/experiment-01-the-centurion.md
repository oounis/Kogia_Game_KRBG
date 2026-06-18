# Origins Experiment 01 - The Centurion (promotion mechanic)

> **Origin:** Othman's own playtest insight. Status: **flagship Origins experiment - to prototype first.**

## The problem it solves (from real play)
In Classic Kharbga, the opening is fun (placement + first captures), but the **midgame goes flat**: once both
sides have eaten a few pieces, the board thins out, contact becomes rare, and both players just shuffle pieces
around separately with no captures for a long time. Motivation, rhythm and tension drop - players quit.
Root cause: custodial capture needs **two** pieces around **one** enemy, which is hard on a sparse board, so
both sides avoid risky contact -> stalemate maneuvering.

## The idea (a promotion mechanic, like checkers' King / chess' Queen)
Reward aggression with a powerful piece that can break the stalemate.

> When one of your Soldiers makes your **7th capture**, that Soldier is promoted to a **Centurion**.

### The Centurion
- **Movement:** slides **any number of empty squares** in a straight line - up / down / left / right
  (like a chess rook), instead of one step. This lets it cross the thinned board and force captures alone.
- **Capture:** still by the **custodial rule** - it captures enemies it sandwiches at the end of its slide;
  chained captures still apply.
- **Vulnerability:** it can also **be captured** like any piece - which makes it precious to protect.

### Lose condition (Othman's version = primary)
- **Option B (implemented):** if at the start of your turn your Centurion is **fully blocked** (no legal move
  - hemmed in by pieces/edges), **you lose the game.** The Centurion is a powerful weapon *and* a liability:
  the enemy can try to trap it instead of fighting your whole army.
- **Option A (variant to test):** the Centurion is your **"king"** - if it is **captured**, you lose. Cleaner
  and very chess-like (hunt/protect the key piece). Recommended to A/B test against B in playtesting.

## Why it works
1. **Restores midgame motivation** - both players now chase a clear goal: "reach 7 captures -> unlock my Centurion."
2. **Breaks the no-contact stalemate** - a free-sliding piece can engineer captures across the empty board.
3. **Creates a focal, high-stakes piece** - drama returns (attack it / defend it), exactly what Classic lacks.
4. **Self-balancing** - the leader's reward (Centurion) is also a vulnerability, so the lead is not automatic.

## Open tuning questions (decide by playtest)
- **Threshold:** is **7** right? Test 5 / 7 / 10 (out of 24 captures-to-win).
- **Both players** can earn a Centurion? (Recommended: yes - keeps it fair.)
- **One Centurion at a time** per side? If it's captured (Option A off), can you earn another at the next milestone?
- **Block vs capture** as the loss trigger (Option B vs A) - reconcile so it feels fair, not cheap.
- Does the Centurion's first promotion move trigger immediately, or next turn?

## Rule delta vs Classic (for the engine)
```
state += { capturesByPlayer, centurionSquarePerPlayer }
on capture:  capturesByPlayer[p] += n
             if capturesByPlayer[p] crosses 7 and no Centurion yet:
                 promote the capturing Soldier -> Centurion
legalMoves(Centurion) = slide along empty cells in 4 orthogonal directions (stop before pieces/edge)
applyMove(Centurion):  custodial capture check at landing square; chained captures continue
checkLoss(p):  Option B -> if Centurion exists and has 0 legal moves at turn start -> p loses
               Option A -> if p's Centurion was just captured -> p loses
```

## Next step
Prototype this in the TypeScript engine as `Origins v0.1` behind a flag, play 10 games vs a basic AI, and
**measure: did the midgame stalemate disappear?** Keep if yes; tune the threshold; decide Option A vs B.
