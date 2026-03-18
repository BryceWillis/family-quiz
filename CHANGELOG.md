# Changelog

All notable changes to Family Quiz are documented here.

---

## v1.6 — March 2026

- Players now use their entered name throughout the game
- Added 🎲 button on the join screen to fill in a random silly name
- Wrong answer card now shows in red; correct answer stays green

## v1.5 — March 2026

- Added Google Analytics via Firebase Analytics
- Removed auto-playing text-to-speech — TTS is now manual only
- Added "What's New" button on home screen with version history modal
- Added recent games panel on home screen and scoreboard (last 5 sessions)
- Added README with setup and configuration instructions

## v1.4 — March 2026

- Fixed host getting stuck on scoreboard after clicking Next Question
- Both host and players now navigate via real-time Firestore `onSnapshot` watchers
- Eliminated unreliable `get()` calls after `update()` for navigation

## v1.3 — March 2026

- Added 🔊 Read Aloud button on question screen (Web Speech API)
- Button toggles to ⏹ Stop while reading — tap again to cancel mid-read
- Helps younger players who are still learning to read

## v1.2 — March 2026

- Questions cached in `localStorage` by topic + difficulty
- Unseen questions shown first; oldest recycled when bank runs low
- AI asked for 5 extra questions each call to grow the bank faster
- Claude API key saved to `localStorage` — only type it once per device

## v1.1 — March 2026

- Added difficulty slider: Easy, Medium, Difficult, Impossible
- Claude prompt tailored to chosen difficulty level
- Difficulty label shown on generating screen

## v1.0 — March 2026

- Initial release
- Real-time multiplayer quiz on any topic
- Claude AI generates fresh questions for every game
- Firebase Anonymous Auth with silly animal names (e.g. "Bouncy Narwhal")
- Synchronized countdown timer using Firestore `serverTimestamp`
- Live leaderboard after every question
- Share game via 4-character code or direct link
- Host controls question pacing; Skip Round button
- Play Again from the final results screen
