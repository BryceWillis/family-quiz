# Family Quiz — Feature Backlog

---

## Proposed Releases

---

### ~~v1.10 — Polish & Accessibility~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| 4 | **Share text includes topic** | ✅ Done |
| 5 | **TTS highlights as it reads** | ✅ Done |
| 6 | **20-question option** | ✅ Done |
| 7 | **iPhone home screen icon** | ✅ Done |

---

### ~~v1.11 — Results Screen Upgrades~~ ✅ Shipped

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Color-coded player results** | On the round results screen, replace the "Got it right" chip list with a full player list — green chip for correct, red chip for wrong. Current player ("you") is highlighted distinctly (e.g. bold outline or ✨ marker), same as the leaderboard treatment. |
| 2 | **All-correct / all-wrong reactions** | If every player gets the question right, show a celebratory banner or emoji burst (e.g. 🎉🎉🎉 "Everyone got it!"). If no player gets it right, show a commiseration banner (e.g. 😬 "Nobody got this one — even the AI is impressed!"). These replace the existing "Nobody got this one — tricky!" plain text for the all-wrong case. |

---

### v1.12 — Moderation Controls
*Same Firestore operations (player docs), same lobby/in-game UI surface.*

| # | Feature | Detail |
|---|---------|--------|
| 3 | **Host kicks a player** | Manual kick button per player in host view (always available). Auto-kick triggered after 2 consecutive missed answers with a warning shown to the host first ("Player X has missed 2 questions — kick them?"). Important because infinite-timer mode means the host shouldn't have to wait forever for an absent player. |
| 4 | **Host goes absent (missed 2 questions)** | If the host themselves misses 2 consecutive answers, they are kicked automatically (no warning — there is no one to show it to) and host duties are assigned at random to one of the remaining active players. The new host inherits full host controls immediately. |
| 5 | **Players vote to kick host** | Any player can initiate. All other players must agree unanimously within a 30-second window. If vote passes, the host is removed and a new host is chosen at random from the remaining players. The new host inherits full host controls. |

**Open question:**
- **Vote to kick — new host auto-navigation:** When a vote passes and a random player becomes the new host, they may be looking at the question or results screen (not a host-specific view). Does their UI automatically update to show host controls (skip button, next button, kick buttons) in place? Or do we navigate them to a "you are now host" confirmation screen first? *Needs clarification before building.*

---

### ~~v1.13 — Session Resilience (Rejoin)~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| 6 | **Rejoin game in progress** | ✅ Done — session saved to `fq_session` in localStorage on join/host. On reload, `tryRejoin()` checks the session is still active and the player doc still exists, then navigates directly to the correct screen (lobby, question, results, or final). Cleared on showHome() and showFinal(). |

---

### ~~v1.14 — Question Feedback~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| - | **👍/👎 buttons on both screens** | ✅ Done — question screen + results screen |
| - | **Toggle/undo votes** | ✅ Done — tap again to undo, works on either screen |
| - | **Per-question vote counters in Firestore** | ✅ Done — `upvotes`, `downvotes`, `score` on each question in `/questionBank` |
| - | **Score-based draw exclusion** | ✅ Done — `score < 0` moves question to last-resort tier |

---

### ~~v1.15 — Generating Screen + Banned Words~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| - | **Animated generating screen** | ✅ Done — cycling silly status messages with fade transitions |
| - | **Banned word list** | ✅ Done — names silently replaced with silly names; topics show "mmm no thanks" modal; AI questions containing banned words filtered before storing |

---

### ~~v1.16 — Host Cancel Game + Session Cleanup~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| - | **Host can end game early** | ✅ Done — 🛑 End Game on question + results screens; all clients redirect to final scores |
| - | **Session status tracking** | ✅ Done — `ended-manual` (host cancel), `ended-auto` (server cleanup), shown as badges in recent games |
| - | **Auto-cleanup Cloud Function** | ✅ Done — `cleanupOldSessions` runs daily, closes sessions >7 days old to `ended-auto` |

---

### ~~v1.13 — Showdown Live~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| - | **Renamed to Showdown Live** | ✅ Done |
| - | **👎 flag button on question screen** | ✅ Done |
| - | **Server-side question bank (Firestore)** | ✅ Done — questions shared across all devices |

---

### ~~v1.12 — Polish and Question Feedback~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| - | **Em dash removal** | ✅ Done — replaced throughout UI with context-appropriate punctuation |
| 7 | **👎 Question feedback button** | ✅ Done — flags to Firestore `/flaggedQuestions`, down-ranks in local bank |

---

### v1.19 — Admin Panel
*All admin functions grouped behind a single gate. Themes (v1.20) depend on this existing first.*

**Authentication approach:** Password validated via Cloud Function — the password is never exposed in client JS. Admin page is a separate route/screen that calls a Cloud Function with the entered passphrase; the function confirms it and returns a short-lived token stored in sessionStorage. Can revisit if multiple admins are ever needed.

| # | Feature | Detail |
|---|---------|--------|
| - | **Admin gate** | Hidden admin screen accessible via special URL parameter or link. Password validated by Cloud Function, not client-side. |
| - | **View error logs** | Surface Cloud Function errors and client-side errors written to a Firestore `/logs` collection. Show timestamp, error message, stack if available. |
| - | **View stored question topics** | List all topic+difficulty combinations in the question bank (from Firestore or a global bank), with count of questions stored and count flagged. |
| - | **View flagged questions** | Table of 👎-flagged questions with topic, difficulty, question text, flag count, and date. Actions: dismiss flag (keep question), delete question from bank, or mark for AI revision. Export as CSV for bulk cleanup. |

---

### v1.20 — Themes (Promoted Topics)
*Depends on admin panel (v1.19). Host-facing feature that reduces AI calls for popular topics.*

| # | Feature | Detail |
|---|---------|--------|
| - | **Admin defines promoted topics ("themes")** | In the admin panel, admin can create named themes (e.g. "Animals 🐘", "Disney 🏰", "Space 🚀"). When a theme is saved, the system triggers AI question generation for every difficulty level. If difficulty levels are added later, the admin manually triggers re-generation from the admin panel (not automatic). Questions stored in Firestore under `/themes/{themeId}/questions`. |
| - | **Themes shown on host setup page** | Up to 3 promoted themes displayed as tap-to-select cards below the topic input field on the host setup screen. Selecting a theme prefills the topic field and pulls questions from the server — no AI call needed during game creation (unless the stored count is below the requested question count, in which case more are generated and added). |

---

### ~~v1.17 — Smart Question History (Per-Host)~~ ✅ Shipped

| # | Feature | Status |
|---|---------|--------|
| 14 | **Host-scoped question repeat avoidance** | ✅ Done — seen history stored in `fq_seen_{uid}` (separate from the shared question cache). Two people hosting from the same device each get independent seen history. Questions never hard-excluded — unseen come first, seen deprioritised, score < 0 last. |

---

### ~~v1.18 — Security Audit & Hardening~~ ✅ Shipped

| # | Area | Status |
|---|------|--------|
| 15 | **Firestore rules — sessions** | ✅ Done — session writes locked to host UID; player score/lastAnswerCorrect writable only by host |
| 16 | **Firestore rules — question bank** | ✅ Done — read-only for clients; all writes via Cloud Functions (admin SDK) |
| 17 | **Firestore rules — flaggedQuestions** | ✅ No change — delete already blocked; accepted |
| 18 | **App Check (generateQuestions rate limiting)** | ✅ Done — App Check compat script added, activation code wired. **Requires console step:** Firebase console → App Check → register web app with reCAPTCHA v3 → fill in `RECAPTCHA_SITE_KEY` in app.js → enforce on Functions. |
| 19 | **Banned word bypass** | ✅ Accepted — best-effort regex sufficient for family use |
| 20 | **Anthropic API key** | ✅ No change — stored in Firebase Secrets, never in client |
| 21 | **Session code brute force** | ✅ Accepted — short-lived codes, host can kick; low risk |
| 22 | **XSS** | ✅ Done — `escapeHtml()` applied to all user-supplied innerHTML |
| 23 | **Client-side score manipulation** | ✅ Covered by rules — players cannot write `score` or `lastAnswerCorrect` to their own doc. Host calculates scores (host self-cheating is accepted residual risk for a family app). Full server-side scoring deferred indefinitely. |

---

### v1.21 — Rematch
*Lets the whole party jump straight into a new game from the final scores screen without anyone going back to the home screen.*

**Behaviour overview:**

All players (host and non-host) see a **🔄 Rematch** button on the final scores screen. The host always creates the new game; non-host players signal their intent and then wait.

**Non-host player flow:**
1. Tap **🔄 Rematch** → screen transitions to a "challenge sent" state: large **⚔️ Rematch challenge sent!** heading, live-updating list of every player who has also tapped (shows their name as they join in), and a **✕ Cancel** link that takes them back to the home screen.
2. When the host taps Rematch → screen shifts to **😈 Rematch Accepted!** (dramatic styling — bold/red/dark palette, menacing emoji). Player stays here while the host configures the new game.
3. When the new game lobby is ready → player is auto-navigated to the new lobby with their display name already filled in. No re-entry of name or code needed.

**Host flow:**
1. Sees the **🔄 Rematch** button. A small live counter shows how many challengers are already waiting (e.g. "3 players want a rematch ⚔️"), updating in real time as non-host players tap.
2. Tap **🔄 Rematch** → taken to the host setup form, pre-filled with the previous game's topic and difficulty. Host can change either before generating.
3. Generates questions and creates the new session as normal. When the new lobby opens, the app writes `nextSessionId: newCode` to the old session doc.
4. All players still watching the old session's final screen detect `nextSessionId` and are automatically navigated to the new lobby.

**Cancellation & edge cases:**
- Any player (including the host) can cancel at any time before the new lobby opens by tapping **✕ Cancel** / navigating away — takes them to the home screen. They simply won't appear in the new lobby.
- Players who already left the final screen before the rematch started miss it — no notification is sent.
- If the host cancels / navigates away, players waiting on the "challenge sent" screen are not automatically notified. The Cancel button is always visible so they are never truly stuck.

**Data model:**
- Each non-host player signals intent by creating a doc at `sessions/{sessionId}/rematch/{playerId}` with `{ displayName, requestedAt }`. Players can only write their own doc (fits existing security rules with a new subcollection rule).
- Host watches this subcollection on the final screen to drive the live challenger count.
- When the new session is ready, host writes `nextSessionId` to the old session doc (already allowed under host-write rules).
- Non-host players watch the old session doc for `nextSessionId` to trigger auto-navigation.
- Auto-join: on arrival at the new lobby the app checks `state.rematchFrom` and uses the player's saved `displayName` to create their player doc silently, skipping the join form entirely.

**Firestore rules addition needed:**
```
match /sessions/{sessionId}/rematch/{playerId} {
  allow read:   if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == playerId;
  allow delete: if request.auth != null && request.auth.uid == playerId;
}
```

---

### v1.22 — Model Routing by Difficulty
*Use a faster/cheaper model for easy questions, reserve the full model for hard ones.*

Route `generateQuestions` calls based on difficulty level:

| Difficulty | Model | Rationale |
|------------|-------|-----------|
| Easy (0) | `claude-haiku-4-5` | Pattern-match facts, quality is fine, much faster |
| Medium (1) | `claude-haiku-4-5` | General knowledge still well within Haiku's capability |
| Hard (2) | `claude-opus-4-6` | Nuanced distractors and competitive wrong answers need the stronger model |
| Impossible (3) | `claude-opus-4-6` | Counterintuitive facts and expert-level reasoning require it |

One-line change in the Cloud Function — swap the `model` field based on the `difficulty` param. Should be tried and benchmarked before shipping to confirm the quality tradeoff is acceptable at Haiku for Medium.

---

### v1.23 — Fast Start (Progressive Question Loading)
*Start the game as soon as a minimum number of questions are ready, rather than waiting for the full set.*

**Behaviour:**
1. Host taps Generate. The Cloud Function requests the full question count from Claude.
2. As soon as 3 questions are parsed and stored, the session is created and the lobby opens — the generating screen disappears.
3. The remaining questions continue arriving in the background and are appended to the session's question list in Firestore.
4. The game plays normally. By the time the first 3 rounds are done, all remaining questions are ready.

**Open design questions:**
- If background generation fails partway through, what happens when the game reaches the last available question? Options: end the game early, show an error and let the host skip to final scores, or auto-generate one more on the fly.
- Does the question count shown to players ("Question 3 / 10") reflect the final expected count or just what's loaded so far?
- Claude's API doesn't stream structured JSON reliably — most likely implementation is two sequential requests: a fast first batch of 3, then a background request for the remainder. Needs benchmarking to confirm the UX improvement is worth the added complexity.

---

### v1.24 — Semantic Question Deduplication (Embeddings)
*Prevent near-duplicate questions from accumulating in the bank as it grows to hundreds of questions per topic.*

**Problem:** The current deduplication check uses normalized text matching, which only catches exact or near-exact wording. Claude frequently generates semantically identical questions across separate generation calls ("Which planet is closest to the Sun?" vs "What is the nearest planet to the Sun?"). At scale this degrades the question bank significantly.

**Proposed approach:**
1. When a question is stored, generate an embedding vector for the question text
2. Store the embedding alongside the question in Firestore
3. Use Firestore's native vector search to find nearest neighbors for any incoming question
4. Reject anything above a similarity threshold (e.g. 0.92 cosine similarity) before writing
5. On write, store the new question with its embedding for future comparisons

**Open questions before building:**
- Embedding model: Anthropic embeddings via the same API key, or a dedicated model (e.g. OpenAI `text-embedding-3-small` which is very cheap)? Keeping one vendor is simpler; OpenAI's embedding model may be better optimised for this task.
- Firestore vector search was recently GA'd — worth evaluating limits and pricing before committing.
- Similarity threshold needs tuning — too aggressive and valid questions get rejected, too loose and duplicates slip through. Needs empirical testing.
- Whether to run deduplication at write time (real-time, per question) or as a background cleanup job (batch, periodic).

---

### v1.25 — Dev Mode (Single-Player UI Testing)
*Fast solo walkthrough of all UI states without API calls or a second device.*

**Gate:** Secret tap sequence on the home screen logo — e.g. tap the logo icon 7 times rapidly. No URL param, nothing visible in the UI. Activates a "Dev Game" button on the home screen for the remainder of the session. Pattern and count TBD before building.

**Behaviour:**
- Skips Claude entirely — uses a small set of hardcoded mock questions designed to exercise specific UI states (normal question, all-correct round, all-wrong round, last question → final screen)
- Allows starting a game with 1 player (host only)
- Otherwise identical to a real game — same Firestore writes, same listeners, same navigation. Tests the real code paths, not a mock

**Distinct from regular test games:**
Dev mode is for fast UI walkthroughs with no API cost. Regular games on common topics (animals, geography, Pixar, etc.) should still be played intentionally to pad out the Firestore question bank — those are a valuable side effect of testing and not something dev mode replaces.

**Open question:** What's the secret word? Needs to be set before building.

---

## Open Questions / Decisions Needed Before Building

| Item | Question |
|------|----------|
| v1.12 vote to kick host | When a new host is randomly assigned mid-game, do their host controls appear in-place (skip button, next button, etc.) or do we navigate them to a confirmation screen first? |
| Easy difficulty distractors | Should Easy questions always include one obvious-wrong "foil" answer, or just ensure wrong answers are age-appropriate in their wrongness? Needs playtesting with Haiku-generated questions before changing the prompt. |

---

## Long-Term Roadmap

These are not yet versioned or fully designed. Captured here to preserve the vision.

---

### User Tiers & Authentication
*Foundation for achievements, customization, and monetisation. Everything below this depends on it.*

Anonymous play always works — no account required to join or host. Logged-in tiers unlock additional features:

| Tier | Description |
|------|-------------|
| **Anonymous** | Default. No account. Can play fully but earns nothing persistent. |
| **User** | Free account. Persistent identity, can earn achievements. |
| **Subscriber** | Paid tier. Unlocks player card customisation and premium cosmetics. |
| **Founder** | Special early-supporter tier. Granted manually or via code. Full subscriber perks + a permanent Founder badge. |

Identity approach TBD — likely Firebase Auth (Google/email) layered on top of the existing anonymous auth session.

---

### Achievement System
*Logged-in users only. Achievements are permanent and tied to account.*

Examples (not final): first win, win 10 games, host 5 games, get every question right in a game, play with 6+ people, answer in under 3 seconds, etc. Achievements surface on the player card and final scores screen. Design and full list TBD.

---

### Player Cards & Customisation
*Subscriber tier and above. Players have a persistent card shown on the lobby and leaderboard.*

Customisable elements TBD — likely includes avatar/icon, card colour or border, title/badge. Some elements unlocked by reaching achievements; others by subscriber status; others by special code entry.

---

### Unlockable Cosmetics
*Earned through gameplay, achievements, or special codes.*

Codes can be distributed at events, embedded in merch, or given as rewards. Unlocks are tied to the logged-in account and persist across devices. Items TBD — could include exclusive card frames, icons, titles, or animated effects.

---

### UI Skins
*User-selectable visual themes. The current UI becomes the "OG" skin.*

| Skin | Description |
|------|-------------|
| **OG** | Current design. Always available. |
| **Skeuomorphic Mode** | Rich textures, depth, physical feel — buzzers, felt tables, worn leather, etc. |
| *(future)* | Additional skins TBD — could be seasonal, subscriber-exclusive, or unlockable. |

Skin selection persists per account (logged-in) or per device (anonymous).

---

### Battle Mode
*Competitive layer on top of the standard game. Mechanics TBD.*

Answering questions correctly builds a meter. When the meter fills, the player can unleash a challenge on a single opponent or all other players. Challenges are UI disruptions designed to make answering harder — examples:

| Challenge | Effect |
|-----------|--------|
| **Shake** | Screen shakes continuously for a few seconds |
| **Flip** | Screen flips upside down for the duration of a question |
| **Fog** | Translucent overlay obscures the question/answers |
| **Rain** | Animated raindrops fall across the screen |
| *(future)* | Additional challenges TBD |

Open design questions: meter fill rate, how long effects last, whether effects stack, whether the target can see who attacked them, opt-in vs default mode.

---

### Battle Pass
*Seasonal progression system. Earns points through play to unlock cosmetics on a track.*

Each battle pass (OG and future seasons) has a linear unlock track. Players earn points by playing games — wins, correct answers, streaks, etc. Points advance position on the track, unlocking rewards at each milestone.

Reward types (examples): player card backgrounds, card effects (animated borders, glows), titles, icons. Some slots on the track are free-tier; premium slots require subscriber status or battle pass purchase. Past battle passes expire but earned items are kept permanently.

---

## Maintenance

| Item | Detail | Deadline |
|------|--------|----------|
| **Upgrade Cloud Functions to Node 22** | Node 20 is deprecated 2026-04-30 and decommissioned 2026-10-30. Update `engines` in `functions/package.json` and redeploy. | Before 2026-04-30 |

---

## Ungrouped / Future Ideas
- Dark mode
- Emoji reactions during questions (👍 😱 🤔)
- Host preview of generated questions before the game starts
- Custom question sets (host uploads their own Q&A)
- AI revision of 👎-flagged questions (replace poor questions with improved versions, keep the rest)
