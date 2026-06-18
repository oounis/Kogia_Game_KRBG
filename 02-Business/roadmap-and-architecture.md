# Kharbga: Origins — Roadmap & Architecture

## Vision
Preserve North-African heritage through a modern, beautiful, free strategy game — starting with Kharbga,
then a wider collection of traditional Tunisian games under **Kogia Games**.

## The Kogia Group north star (context, NOT current work)
```
Kogia Group  (vision)
├── Kogia Games   ← THIS is what we build now → Kharbga: Origins
├── KogiaEdu      ← future venture (online school, driving-licence app, AI learning)
└── KogiaBiz      ← future venture (accounting, HR, legal, ERP)
```
> KogiaEdu and KogiaBiz are separate future companies. They get their own repos when they get real work.
> Do **not** scaffold them here. Focus is the moat.

## Phased roadmap (solo developer)
### Phase 0 — Foundation ✅ (now)
Repo, sourced research, authoritative rules spec, brand direction.

### Phase 1 — Website 🎯 (next)
- Sections: Home · History · Rules (How to Play) · Gallery · Download (coming soon) · Contact.
- Goal: a live, shareable URL + **email capture** to build an audience before launch.
- Stack: static site (HTML/CSS/JS), deployed free (GitHub Pages / Netlify).
- Languages: Arabic (RTL) · French · English.

### Phase 2 — Game v1 (single-player)
- Pure **TypeScript rules engine** built directly from `docs/03-game-design/rules.md`.
- **HTML5 Canvas** board UI. AI opponent: start with 1–2 levels (greedy → minimax/alpha-beta).
- Runs in the browser — embeds into the website's "Play" page.

### Phase 3 — Mobile
- Wrap the web game with **Capacitor** → Android first (Google Play, $25 one-time), then iOS ($99/yr, needs Mac/cloud-Mac).
- Same codebase as the web game — no separate Flutter/Unity app.

### Phase 4 — Online (only when single-player is solid)
- **Supabase** = Postgres + auth + realtime + storage on a free tier.
- Features: accounts, online multiplayer, global leaderboard, ranking ladder (The Kid → Sheikh of Tataouine).

### Phase 5 — Expand
- More AI levels, **Fog Mode**, heritage board/piece themes (date-seed, shell, stone), then the next traditional game.

## Architecture decisions (and what we rejected)
| Concern | Chosen | Rejected (over-kill for solo v1) |
|--------|--------|----------------------------------|
| Game engine | TypeScript + HTML5 Canvas | Unity |
| Mobile | Capacitor (reuse web game) | Flutter (separate codebase) |
| Backend | None until Phase 4, then Supabase | Hand-built NestJS + self-managed PostgreSQL |
| Website | Static site, free hosting | Heavy CMS / full Next.js app |
| Repos | One repo now (this one) | Multi-repo corporate org |

**Guiding rule:** ship Kharbga end-to-end (website → playable → store) before opening any new front.

## Monetisation (realistic — see earlier analysis)
- Free game, light ads (low ARPU in MENA; diaspora/EU users worth ~4–8×).
- Optional: remove-ads IAP + heritage cosmetic themes.
- First release ≈ pocket money, not salary. Real value = shipped product + audience + brand + a base to grow.
