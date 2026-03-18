# Family Quiz 🎉

A real-time multiplayer quiz game for the whole family. A host creates a game, players join on their own devices, and everyone answers AI-generated questions at the same time. Fun, fast, and works great with kids.

---

## Features

- **AI-generated questions** — Claude generates fresh questions on any topic you choose
- **Real-time multiplayer** — All players see questions and scores live, synced via Firestore
- **Silly animal names** — Each player gets a random name like "Bouncy Narwhal"
- **Difficulty levels** — Easy, Medium, Difficult, and Impossible
- **Question bank** — Questions are cached locally so the AI isn't called every game
- **Countdown timer** — Synchronized across all devices
- **Text-to-speech** — Read questions aloud for younger players (manual toggle)
- **Shareable game link** — Join by code or direct link
- **Leaderboard** — Live scores after every question and at the end
- **Play Again** — Host can restart with the same players

---

## Tech Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript (no build step)
- **Hosting:** Firebase Hosting
- **Database:** Cloud Firestore (real-time)
- **Auth:** Firebase Anonymous Authentication
- **AI:** Anthropic Claude API (direct browser calls)
- **Analytics:** Firebase Analytics (Google Analytics 4)

---

## Setup

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (for Firebase CLI)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- An [Anthropic API key](https://console.anthropic.com/)

### 2. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project
2. Enable **Firestore Database** (start in production mode)
3. Enable **Authentication** → Sign-in method → **Anonymous**
4. Enable **Google Analytics** when prompted during project creation (or add it later under Analytics in the sidebar)
5. Enable **Hosting**

### 3. Connect This Repo to Your Project

```bash
firebase login
firebase use --add   # select your project
```

### 4. Deploy

```bash
firebase deploy
```

That's it. The app will be live at your Firebase Hosting URL (e.g. `https://your-project.web.app`).

---

## Configuration

### Anthropic API Key

The host enters their Claude API key on the "Host a Game" setup screen. The key is saved to `localStorage` in the browser so it only needs to be entered once per device. It is never sent to any server — it goes directly from the browser to the Anthropic API.

Get a key at [console.anthropic.com](https://console.anthropic.com).

### Firestore Security Rules

The included `firestore.rules` file restricts all reads and writes to signed-in users (anonymous auth counts). No data is publicly accessible.

---

## How to Play

1. **Host** opens the app, clicks "Host a Game", enters a topic and difficulty, and generates questions
2. **Players** click "Join a Game" and enter the 4-character game code (or use the share link)
3. Host starts the game from the lobby once everyone has joined
4. All players answer each question before the timer runs out
5. Results and scores are shown after each round
6. The host advances to the next question
7. Final scores and winner are revealed at the end

---

## Development

All source files are in `public/`. There is no build process — edit and deploy directly.

```
public/
  index.html   — App shell and all screen markup
  app.js       — All game logic
  style.css    — Styles
firestore.rules — Firestore security rules
firebase.json   — Firebase project config
```
