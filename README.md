# Showdown Live 🎉

Real-time multiplayer quiz for families and groups. A host picks a topic, AI generates the questions, everyone answers on their own device, and a live leaderboard settles the score.

**Live:** [family-quiz-9815.web.app](https://family-quiz-9815.web.app)

---

## Features

- **AI-generated questions** — Claude generates fresh questions on any topic; cached in Firestore so repeat topics are instant
- **Real-time multiplayer** — All players see questions and scores live via Firestore listeners
- **Difficulty levels** — Easy, Medium, Hard, Impossible
- **Timer options** — 20 / 30 / 45 / 60 seconds per question, or No Timer
- **Scoring modes** — Flat 100 pts per correct answer, or Speed Bonus (100–1000 pts based on how fast you answered)
- **Question bank** — Questions cached locally and server-side; seen questions are deprioritised per host
- **Question feedback** — 👍/👎 on every question; poor-rated questions are deprioritised automatically
- **Text-to-speech** — Reads questions aloud with word highlighting; manual toggle
- **Rejoin** — Players who disconnect or refresh are dropped back into the active game automatically
- **Host controls** — Skip round, end game early, start next question
- **Banned word list** — Inappropriate topics and names silently redirected
- **Shareable link** — Join by 4-character code or direct URL
- **Recent games panel** — Home screen shows the last 5 games with topic, status, and player count
- **What's New** — Version history accessible from the home screen

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML / CSS / JavaScript (no build step) |
| Hosting | Firebase Hosting |
| Database | Cloud Firestore (real-time) |
| Auth | Firebase Anonymous Authentication |
| Backend | Cloud Functions v2 (Node 20) |
| AI | Anthropic Claude API (`claude-opus-4-6`) |
| Analytics | Firebase Analytics (Google Analytics 4) |

---

## Setup

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- An [Anthropic API key](https://console.anthropic.com/)

### Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Enable **Firestore Database** (production mode)
3. Enable **Authentication** → Anonymous sign-in
4. Enable **Hosting**
5. Enable **Functions** (requires Blaze pay-as-you-go plan)

### Connect and configure

```bash
firebase login
firebase use --add          # select your project
cd functions && npm install && cd ..
```

### Store the Anthropic API key as a secret

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# paste your key when prompted
```

The key is stored in Google Cloud Secret Manager and injected at runtime — never exposed to the browser.

### Deploy

```bash
firebase deploy
```

> **First deploy note:** If functions deployment fails with a permissions error, grant `roles/cloudbuild.builds.builder` to `<project-number>@cloudbuild.gserviceaccount.com` in [GCP IAM](https://console.cloud.google.com/iam-admin/iam), then redeploy.

---

## Security

- **Firestore rules** — Session state writable only by host UID; player scores writable only by host; question bank read-only for clients (all writes via Cloud Functions admin SDK)
- **App Check** — reCAPTCHA v3 protection on Cloud Functions (activation placeholder in `app.js`; requires Firebase console steps)
- **XSS** — All user-supplied content passed through `escapeHtml()` before any `innerHTML` use
- **API key** — Anthropic key in Google Cloud Secret Manager; never in client code or network traffic
- **Anonymous auth** — All Firestore reads/writes require a signed-in user

---

## How to play

1. **Host** opens the app, taps "Host a Game", enters a topic, difficulty, question count, timer, and scoring mode
2. **Players** tap "Join a Game" and enter the 4-character code (or tap the share link)
3. Host starts the game from the lobby
4. All players answer each question simultaneously
5. Results and scores shown after each round; host advances to the next question
6. Final leaderboard and winner revealed at the end

---

## Project structure

```
public/
  index.html      — App shell and all screen markup
  app.js          — All client-side game logic
  style.css       — All styles
functions/
  index.js        — Cloud Functions: generateQuestions, submitVote, cleanupOldSessions
  package.json    — Node 20 dependencies
firestore.rules   — Firestore security rules
firebase.json     — Firebase project config
BACKLOG.md        — Planned features and long-term roadmap
```

---

## Development

No build process. Edit files in `public/` and deploy:

```bash
# Hosting only (client changes)
firebase deploy --only hosting

# Functions only
firebase deploy --only functions

# Rules only
firebase deploy --only "firestore:rules"

# Everything
firebase deploy
```
