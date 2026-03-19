# Family Quiz 🎉

A real-time multiplayer quiz game for the whole family. A host creates a game, players join on their own devices, and everyone answers AI-generated questions at the same time. Fun, fast, and works great across all ages.

---

## Features

- **AI-generated questions** — Claude generates fresh multiple-choice questions on any topic you choose
- **Real-time multiplayer** — All players see questions and scores live, synced via Firestore
- **Use your own name** — Players enter their name when joining; a 🎲 button fills in a random silly name if you want one
- **Difficulty levels** — Easy, Medium, Difficult, and Impossible
- **Flexible timer** — Choose 20 / 30 / 45 / 60 seconds per question, or pick "No Timer" for a relaxed pace
- **Scoring modes** — Equal points (100 pts per correct answer) or Speed Bonus (faster answers score up to 1000 pts)
- **Question bank** — Questions are cached locally so the AI isn't called for topics you've already played
- **Text-to-speech** — Read questions aloud for younger or emergent readers (manual toggle, stop any time)
- **Correct answer feedback** — Green card when you got it right, red card when you got it wrong
- **Shareable game link** — Join by 4-character code or a direct URL
- **Live leaderboard** — Updated scores after every question and a final winner reveal
- **Recent games panel** — Home screen and results screen show the last 5 games with topic, status, and player count
- **What's New** — Version history accessible from the home screen
- **Play Again** — Host can restart a new game with the same group

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JavaScript (no build step) |
| Hosting | Firebase Hosting |
| Database | Cloud Firestore (real-time) |
| Auth | Firebase Anonymous Authentication |
| AI | Anthropic Claude API via Firebase Cloud Functions |
| Analytics | Firebase Analytics (Google Analytics 4) |

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
4. Enable **Google Analytics** when prompted (or add it later under Analytics in the sidebar)
5. Enable **Hosting**
6. Enable **Functions** (requires the Blaze pay-as-you-go plan)

### 3. Connect This Repo to Your Project

```bash
firebase login
firebase use --add   # select your project
```

### 4. Store Your Anthropic API Key as a Secret

The API key lives in Google Cloud Secret Manager — it is never exposed to the browser or visible in network traffic.

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# paste your key when prompted
```

### 5. Install Cloud Function Dependencies

```bash
cd functions
npm install
cd ..
```

### 6. Deploy

```bash
firebase deploy
```

The app will be live at your Firebase Hosting URL (e.g. `https://your-project.web.app`).

> **First deploy note:** The Cloud Build service account needs the `Cloud Build Service Account` IAM role. If the functions deploy fails with a permissions error, grant `roles/cloudbuild.builds.builder` to `<project-number>@cloudbuild.gserviceaccount.com` in [GCP IAM](https://console.cloud.google.com/iam-admin/iam), then redeploy.

---

## Security

- The Anthropic API key is stored in **Google Cloud Secret Manager** and injected into the Cloud Function at runtime — it never touches the browser or transit
- All Firestore reads and writes require a signed-in user (anonymous auth counts)
- The Cloud Function validates all inputs before calling the AI API

---

## How to Play

1. **Host** opens the app, clicks "Host a Game", enters a topic, difficulty, number of questions, timer setting, and scoring mode
2. **Players** click "Join a Game" and enter the 4-character game code (or use the share link)
3. Host starts the game from the lobby once everyone has joined
4. All players answer each question before the timer runs out (or at their own pace with No Timer)
5. Correct/wrong feedback and scores are shown after each round
6. The host advances to the next question
7. Final scores and winner are revealed at the end

### Scoring Modes

| Mode | Points |
|---|---|
| Equal points | 100 pts for every correct answer, regardless of speed |
| Speed bonus | Correct answers score 100–1000 pts based on how fast you answered |

Speed bonus requires a timed game (any option other than "No Timer").

---

## Project Structure

```
public/
  index.html      — App shell and all screen markup
  app.js          — All game logic
  style.css       — Styles
functions/
  index.js        — Cloud Function: generateQuestions (calls Anthropic API)
  package.json    — Node 20 dependencies
firestore.rules   — Firestore security rules
firebase.json     — Firebase project config
CHANGELOG.md      — Version history
```

---

## Development

No build process — edit `public/` files and run `firebase deploy --only hosting` to push changes live. To also redeploy the Cloud Function, run `firebase deploy` (or `firebase deploy --only functions`).
