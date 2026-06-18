# Kharbga: Origins - by Kogia Games

> The 2,500-year-old soldier-strategy game of Tataouine - reborn as a modern, free game for the world.

A digital revival and **cultural-preservation project** for **Kharbga**, the traditional North-African
strategy game descended from the Roman *Ludus Latrunculorum* ("the game of soldiers"). Pure skill, no luck.

> **Naming convention:** the game itself uses **English / Roman (Latin)** names only. "Kharbga" is kept as
> the original game name; all in-game terms are English/Roman (Soldier, Centurion, Citadel, the Exchange).
> Local heritage terms appear only as historical notes in `01-Research` / `11-History`.

---

## Two modes (the design philosophy)
- **Classic Mode** = 100% authentic Kharbga (the cultural-preservation promise; never altered).
- **Origins Mode** = the enhanced, modern game where the Innovation-Lab experiments live (e.g. the Centurion).

---

## Roadmap (realistic, solo-developer)
| Phase | Goal | Status |
|------|------|--------|
| **0 - Foundation** | Repo, research, authentic rules, brand | done |
| **1 - Website** | Landing + History + Rules + email capture -> deploy free -> share | next |
| **2 - Game v1** | Playable single-player vs AI (web, TypeScript + Canvas) | todo |
| **3 - Mobile** | Wrap the web game with Capacitor -> Android, then iOS | todo |
| **4 - Online** | Accounts + multiplayer + leaderboard (Supabase) | todo |
| **5 - Expand** | More AI levels, new modes, more traditional games | todo |

## Tech stack (lean, solo-friendly)
- **Website:** static site (HTML/CSS/JS) -> free hosting (GitHub Pages / Netlify)
- **Game engine:** **TypeScript + HTML5 Canvas** - no Unity needed for a 7x7 board game
- **Mobile:** **Capacitor** - wraps the same web game into Android/iOS (one codebase)
- **Backend (Phase 4 only):** **Supabase** (Postgres + auth + realtime, free tier)

## Repository structure (full product architecture)
```
00-Corporate/        Kogia Group brand/vision (Edu & Biz = separate future repos)
01-Research/         sourced history + regional variations
02-Business/         roadmap & architecture decisions
03-GameDesign/       rules.md (authoritative Classic spec)
04-UXUI/             wireframes, branding, design system
05-Development/       the code - TS+Canvas game, Capacitor mobile
06-Testing/          functional, performance, UAT
07-Marketing/        social, press kit, store assets
08-Website/          Phase 1 - the official site (code lives here)
09-MobileApps/       Android / iOS / Huawei store builds
10-Operations/       releases, analytics, backups
11-History/          cultural-preservation project (our differentiator)
12-Innovation-Lab/   game-design experiments (Classic vs Origins mode)
```

(c) 2026 **Kogia Games** - Othman Ounis. All rights reserved.
Authentic rules verified against the Kharbga Game Network and southern-Tunisian (Tataouine) play.
