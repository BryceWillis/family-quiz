---
name: verify
description: How to run and verify Showdown Live (this repo) end-to-end with two browser clients
---

# Verifying Showdown Live

No build step; the app is static files in `public/` plus prod Firebase backend.

## Launch

```bash
firebase serve --only hosting --port 5099   # serves public/ AND /__/firebase/init.js with the real project config
```

This connects to the **production** Firestore/Auth/Functions of `family-quiz-9815` — test games are real sessions (they appear in Recent Games and are auto-closed after 7 days by `cleanupOldSessions`).

## Drive

Use Playwright (npm install playwright in a scratch dir; chromium headless shell) with **two browser contexts** — host + player (min 2 players to start a game). Key selectors:

- Host: `#host-name`, `#topic`, `#num-questions`, `#time-per-q` (value `0` = No Timer → manual pacing, best for tests), submit `#host-setup-form button[type=submit]`, code in `#game-code-display`, `#start-btn`, `#skip-btn`, `#next-btn`, `#cancel-lobby-btn`
- Player: `#player-name`, `#join-code`, `#join-form button[type=submit]`
- Screens: active screen is `.screen.active` (`screen-home`, `screen-lobby-host/player`, `screen-question`, `screen-round-results`, `screen-final`); progress via `#q-progress` / `#results-q-label`
- Answers: `.option-btn` (all players answering triggers auto-advance to results after ~1.2s)
- `showError` uses `alert()` — register Playwright dialog handlers

## Gotchas

- Question generation for an uncached topic calls Claude (up to ~2 min); "Animals"/Easy is usually cached in the server question bank.
- All navigation is Firestore `onSnapshot`-driven; to test disconnect/catch-up paths use `context.setOffline(true/false)` and park the host on different states before reconnecting.
- A previous working e2e script covering the full game + disconnect probes existed at the session scratchpad as `e2e.js` — recreate from this recipe if gone.
