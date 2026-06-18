# Kharbga: Origins 🏛️ — by Kogia Games

> The 2,500-year-old soldier-strategy game of Tataouine — reborn as a modern, free game for the world.
> خربقة — لعبة الجنود الإستراتيجية من الجنوب التونسي

A digital revival and **cultural-preservation project** for *Kharbga* (الخربقة), the traditional North-African
strategy game descended from the Roman *Ludus Latrunculorum* ("the game of soldiers"). Pure skill, no luck.

---

## 🎯 What we are building (and what we are NOT — yet)

**Kogia Games** is the gaming brand of the wider **Kogia Group** vision (future: KogiaEdu, KogiaBiz).
But this repository has **one focus**: ship **Kharbga: Origins** — first as a website, then a playable game.

> 🧭 **Principle:** build one thing well and ship it, before opening new fronts.
> The Kogia Group / Edu / Biz vision is real, but it lives as a *north star*, not as empty folders here.

### Roadmap (realistic, solo-developer)
| Phase | Goal | Status |
|------|------|--------|
| **0 · Foundation** | Repo, research, authentic rules, brand | ✅ in progress |
| **1 · Website** | Landing + History + Rules + email capture → deploy free → share | ⏳ next |
| **2 · Game v1** | Playable single-player vs AI (web, TypeScript + Canvas) | ⬜ |
| **3 · Mobile** | Wrap the web game with Capacitor → Android, then iOS | ⬜ |
| **4 · Online** | Accounts + multiplayer + leaderboard (Supabase backend) | ⬜ |
| **5 · Expand** | More AI levels, Fog Mode, more traditional games | ⬜ |

---

## 🛠️ Tech stack (lean, solo-friendly)
- **Website:** static site (HTML/CSS/JS) → free hosting (GitHub Pages / Netlify)
- **Game engine:** **TypeScript + HTML5 Canvas** — no Unity needed for a 7×7 board game
- **Mobile:** **Capacitor** — wraps the same web game into Android/iOS (one codebase)
- **Backend (Phase 4 only):** **Supabase** (Postgres + auth + realtime, free tier)

> Deliberately *not* using: Unity, Flutter, NestJS, a custom server — all over-kill for v1.

---

## 📁 Repository structure
```
Kogia_Game_KRBG/
├── README.md                  ← you are here
├── docs/
│   ├── 01-research/           ← historical research (sourced)
│   │   ├── history.md
│   │   └── regional-variations.md
│   ├── 02-business/
│   │   └── roadmap-and-architecture.md
│   └── 03-game-design/
│       └── rules.md           ← the AUTHORITATIVE rule spec (build the engine from this)
├── web/                       ← the website (Phase 1)
└── game/                      ← the playable game (Phase 2)
```
*(Folders are added when they have real content — no empty scaffolding.)*

---

© 2026 **Kogia Games** · Othman Ounis. All rights reserved.
Authentic rules verified against the Kharbga Game Network and southern-Tunisian (Tataouine) play.
