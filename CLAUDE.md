# T4F Cup Pass — CLAUDE.md

## What This Repo Is

This repo is for **T4F Cup Pass only**, not the main Tickets 4 Fans marketplace.

T4F Cup Pass is a **free-to-play, social baseball companion game** for fans sitting together at a live game. It is inspired by "pass the cup" but must **NOT** include gambling, real-money wagering, wallets, balances, odds, or sportsbook-like behavior.

---

## Stack

- **Vite + React + TypeScript**
- **React Router** for routing
- **Mobile-first only** — design for small screens first; no desktop focus
- Do **NOT** add PWA / service worker / offline work in phase 1
- Do **NOT** add Supabase yet unless explicitly needed
- Build the leanest MVP first using local/mock state

---

## UX Priority

- **Host-first UX** — the primary flow is one main host gameplay screen
- First milestone flow:

```
landing → create game → seat order → start confirmation → host game screen → end game screen
```

Routes:
| Path | Page |
|------|------|
| `/` | Landing |
| `/create` | Create Game |
| `/seat-order` | Seat Order |
| `/start` | Start Confirmation |
| `/game` | Host Game Screen |
| `/end` | End Game Screen |

---

## Core Score Map

| Event | Points |
|-------|--------|
| single | +1 |
| double | +2 |
| triple | +3 |
| home_run | +4 |
| walk | +1 |
| hit_by_pitch | +1 |
| out | -1 |
| strikeout | -2 |
| error | 0 |
| sacrifice | 0 |

---

## Engineering Rules

- Keep **score logic centralized** — one source of truth for all scoring
- Use **pure functions** for gameplay logic where possible
- **Avoid overengineering** — lean MVP first, extend later
- **Explain plan briefly** before making major edits
- Do not add Tailwind, analytics, realtime, or Supabase until explicitly requested
