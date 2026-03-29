# Showdown Live — Analytics Strategy

## Overview

Showdown Live uses **Google Analytics 4 (GA4)** via the Firebase Analytics SDK to track user behaviour across the full game lifecycle — from the home screen through question answering and game completion. Events are fired directly from `app.js` using `gtag('event', ...)` calls.

The primary goals are:

1. Understand how people use the game (session length, topic choices, difficulty preferences)
2. Measure question quality (vote data, skip rate)
3. Identify friction (question generation failures, cancellations, join failures)
4. Inform future feature decisions (what topics are popular, how long games run)

---

## Measurement ID

| Property | Value |
|----------|-------|
| GA4 Measurement ID | `G-DJL0Q390ZF` |
| Firebase Project | `family-quiz-9815` |

---

## Custom Events

### Host Setup

#### `host_setup_submit`
Fired when the host submits the game setup form and question generation begins.

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | string | The topic the host entered (e.g. "Disney movies") |
| `difficulty` | int | 0 = Easy, 1 = Medium, 2 = Difficult, 3 = Impossible |
| `num_questions` | int | Number of questions requested (5, 10, 15, or 20) |
| `time_per_question` | int | Seconds per question; 0 = no timer |
| `scoring_mode` | string | `"flat"` or `"speed"` |

---

### Question Generation

#### `question_generation`
Fired when the AI successfully returns questions (both regular and lunch mode).

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | string | Topic that was generated |
| `difficulty` | int | Difficulty level (0–3); `"lunch_menu"` for lunch mode |
| `model` | string | Claude model used (e.g. `claude-haiku-4-5-20251001`) or `"lunch_menu"` |
| `generation_ms` | int | Time in milliseconds from request to response |
| `question_count` | int | Number of questions returned |

**Use this to:** monitor AI latency, compare model speeds, detect generation failures (absence of event after submit).

---

### Lobby & Sharing

#### `copy_invite_link`
Fired when the host copies the share link in the lobby.

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | string | Game topic |
| `difficulty` | int | Difficulty level (0–3) |

#### `cancel_lobby`
Fired when the host cancels the game from the lobby screen before it starts.

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | string | Game topic |

---

### Gameplay

#### `question_answered`
Fired when the host advances past a question (round results screen appears). Deferred from the moment of tap to capture the final vote state alongside the answer.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question_index` | int | 0-based question number |
| `option` | string | `"A"`, `"B"`, `"C"`, or `"D"` — the option the player selected |
| `correct` | string | `"true"`, `"false"`, or `"skipped"` — whether the answer was right, wrong, or the round was skipped by the host |
| `vote` | int | `1` = upvoted, `-1` = downvoted, `0` = no vote |

> **Why deferred?** Firing at the moment of tap would capture the vote state mid-round. Deferring to the round transition ensures the vote value is final and matches what was synced to Firestore.

#### `read_aloud_start`
Fired when the player taps "Read Aloud" to start TTS.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question_index` | int | 0-based question number |

#### `read_aloud_stop`
Fired when the player taps "Stop" to cancel TTS mid-read.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question_index` | int | 0-based question number |

---

### Generic Interactions

#### `cta_click`
Catch-all for button interactions that don't warrant their own event. Currently used for 👍/👎 vote buttons.

| Parameter | Type | Description |
|-----------|------|-------------|
| `button_name` | string | Identifier for the button tapped. Current values: `vote_up`, `vote_down` |

---

### End of Game

#### `play_again`
Fired when the host taps "Play Again" on the final scores screen. No parameters.

---

## Custom Dimensions & Metrics

These must be registered in **GA4 Admin → Custom definitions** before they appear in reports and explorations.

### Custom Dimensions

| Name | Scope | Parameter | Description |
|------|-------|-----------|-------------|
| Topic | Event | `topic` | The quiz topic string |
| Difficulty | Event | `difficulty` | 0–3 integer difficulty level |
| Model | Event | `model` | Claude model used for generation |
| Option | Event | `option` | Answer option selected (A/B/C/D) |
| Correct | Event | `correct` | Whether the answer was correct/wrong/skipped |
| Scoring Mode | Event | `scoring_mode` | flat or speed |
| Button Name | Event | `button_name` | CTA button identifier |

### Custom Metrics

| Name | Scope | Parameter | Unit | Description |
|------|-------|-----------|------|-------------|
| Generation Time (ms) | Event | `generation_ms` | Milliseconds | AI question generation latency |
| Question Count | Event | `question_count` | Standard | Number of questions generated |
| Vote Score | Event | `vote` | Standard | -1, 0, or 1 vote value per question |
| Time Per Question | Event | `time_per_question` | Seconds | Timer setting for the game |
| Num Questions | Event | `num_questions` | Standard | Questions requested by host |

---

## Recommended Reports & Explorations

### Funnel: Host Game Creation
Track drop-off across the hosting journey:
1. `host_setup_submit` — host attempted to start
2. `question_generation` — AI succeeded
3. `copy_invite_link` — link was shared (proxy for lobby reached)

### Question Quality
Use the `question_answered` event to build a report on:
- % correct answers per `question_index` (are later questions harder?)
- Distribution of `vote` values (which question indices tend to get downvotes?)
- `option` distribution (are players guessing evenly, or are some options over-selected?)

### AI Performance
Use `question_generation` to report on:
- Average `generation_ms` by `model`
- Average `generation_ms` over time (detect regressions)
- Generation volume by `topic` (most popular topics)
- Generation volume by `difficulty`

### Engagement
- `read_aloud_start` vs `read_aloud_stop` ratio (are reads being cut short?)
- `play_again` count (are hosts staying engaged past one game?)
- `cancel_lobby` rate vs `host_setup_submit` (how often does setup get abandoned?)

---

## Calculated Metrics (recommended)

These can be created in **GA4 Admin → Calculated metrics**:

| Metric | Formula | Purpose |
|--------|---------|---------|
| Correct Answer Rate | `question_answered[correct="true"] / question_answered` | Overall accuracy across all players |
| Generation Success Rate | `question_generation / host_setup_submit` | % of host attempts that produce questions |
| TTS Completion Rate | `(read_aloud_start - read_aloud_stop) / read_aloud_start` | How often reads complete without being stopped |

---

## Vote System Design Notes

Votes are **not** incremented in real time. The full pattern:

1. Player taps 👍 or 👎 → stored locally in `state.questionFeedback[key]`
2. `cta_click` fires immediately so button interactions are visible
3. When the host advances to the next question, `flushQuestionAnalytics()` runs:
   - Fires the final `question_answered` event with the settled `vote` value
   - Syncs the vote delta to Firestore once using `state.committedVotes` to prevent double-counting from rapid clicks

This prevents vote inflation from rapid clicking and ensures the `vote` parameter in `question_answered` reflects the player's final settled opinion on the question.

---

## Lunch Mode Notes

Lunch mode (`state.isLunchGame = true`) uses the same `question_answered` event as regular games. The `topic` value is `"School Lunch This Week 🍕"` and `difficulty` is `0`. Vote buttons (👍/👎) are hidden in lunch mode since questions are mandatory and curated — the vote parameters will always be `0` for lunch game events.

---

## Future: Google Tag Manager Migration

The current implementation fires `gtag()` calls directly from `app.js`. A planned future migration will move tag management to **Google Tag Manager (GTM)** with a **server-side container** hosted on Google Cloud Run.

**Why GTM?**

| Benefit | Detail |
|---------|--------|
| Decouple analytics from deploys | Add or modify tracking without touching app code |
| Consent management | GTM has built-in consent mode integration |
| Multi-destination routing | Send the same events to GA4, BigQuery, or future tools |
| Learning vehicle | Using this project to learn GTM for professional work |

**Planned migration path:**

1. **Phase 1 — Web GTM container**: Replace the inline `gtag` snippet in `index.html` with a GTM container tag. Push `dataLayer` events from `app.js` instead of calling `gtag()` directly. All existing GA4 event names and parameters stay identical — GTM just becomes the middleman.

2. **Phase 2 — GTM server-side container**: Deploy a GTM server container to **Cloud Run** (Google's recommended host for server-side GTM). Route the web container's hits to the server container endpoint. The server container forwards to GA4. Benefits: first-party data collection, reduced client-side payload, ad blocker resilience.

3. **Phase 3 — Additional destinations**: With the server container in place, add BigQuery export for raw event-level analysis, and optionally a Slack webhook for milestone notifications (e.g. first game of the day).

See `BACKLOG.md` for the versioned backlog items.
