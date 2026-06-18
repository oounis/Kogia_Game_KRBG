# 08-Website — the official site (Phase 1) ✅

Animated, conversion-focused landing page for **Kharbga: Origins**. Every section funnels visitors to **Download**.

## Stack
Plain static **HTML + CSS + JS** (no build step). Fonts: Cinzel + Outfit (Google Fonts). Cinematic dark theme,
fully animated (scroll reveals, animated hero board, live **combo** demo, **Centurion** promotion demo, count-ups).

## Files
- `index.html` — structure & copy (hero, the tricks, how-to-play, story, download CTA)
- `style.css` — theme (CSS variables — easy to recolor), animations, responsive
- `script.js` — starfield, reveals, hero board, combo + Centurion demos, email capture (stub)

## Run locally
Just open `index.html` in a browser. No server needed.

## Go live (one-time, ~1 minute)
1. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main` (the `deploy-pages.yml` workflow publishes this folder automatically).
3. Live at: `https://oounis.github.io/Kogia_Game_KRBG/`

## TODO before launch
- **Wire the email form** to a real service (Formspree / Mailchimp / Supabase) — currently stores to `localStorage` only.
- Swap CSS-token pieces for real art when available (logo, board, soldiers).
- Add real App Store / Google Play links when the apps exist.
- Optional: Arabic (RTL) + French language toggle.
