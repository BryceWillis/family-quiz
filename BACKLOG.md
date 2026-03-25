# Family Quiz — Feature Backlog

---

## Proposed Releases

---

### v1.8 — Moderation Controls
*Same Firestore operations (player docs), same lobby/in-game UI surface.*

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Host kicks a player** | Manual kick button per player in host view (always available). Auto-kick triggered after 2 consecutive missed answers — important because the infinite-timer mode means the host shouldn't have to wait forever for an absent player. Auto-kick warning shown before triggering. |
| 2 | **Players vote to kick host** | Any player can initiate. All other players must agree unanimously within a 30-second window. If vote passes, a new host is chosen at random from the remaining players. The new host inherits full host controls. |

---

### v1.9 — Session Resilience (Rejoin)
*More complex — requires persistent session awareness and reconnect logic.*

| # | Feature | Detail |
|---|---------|--------|
| 3 | **Rejoin game in progress** | If a player navigates away, closes the tab, or loses connection, they can return to the home URL or the game-specific share link and be dropped back into the active game automatically. They miss points for any questions that passed while they were gone. If a question is currently in progress when they rejoin, they wait on a "rejoining" screen until the host advances to the next question. |

**Identity approach for rejoin:**
Firebase Anonymous Authentication already creates a stable, long-lived user ID (stored in the browser's IndexedDB by the Firebase SDK). This persists across page refreshes and browser restarts until the user clears their browser data. No additional cookie needed — `auth.currentUser.uid` is the persistent device-level identity. On app load, we check localStorage for `{ sessionId, gameCode }` and verify the session is still active in Firestore with that UID still in the players subcollection.

---

### v1.10 — Polish & Accessibility
*Small, low-risk items that improve day-to-day use. No game logic changes.*

| # | Feature | Detail |
|---|---------|--------|
| 4 | **Share text includes topic** | Clipboard text becomes: *"Join our Family Quiz about 'Animals'! Code: ABCD or tap: https://..."* instead of just the raw URL. |
| 5 | **TTS highlights as it reads** | As the screen reader reads the question and each answer option, the corresponding text is highlighted (e.g. bold + background tint). Uses `SpeechSynthesisUtterance` `boundary` events to sync. Simpler fallback: highlight the whole answer option block as it begins being read. |
| 6 | **20-question option** | Add `<option value="20">20</option>` to the questions select. One-liner. |
| 7 | **iPhone home screen icon** | Add Apple touch icon and PWA meta tags so saving to iPhone home screen shows the quiz icon instead of the letter "F". Requires a 180×180 PNG and a couple of `<meta>` tags. |

---

### v1.11 — Question Feedback
*Simple player-facing feedback. Lays the groundwork for v1.12 admin review.*

| # | Feature | Detail |
|---|---------|--------|
| 8 | **👎 "Don't like this question" button** | Shown on the results screen per question. Not framed as an inaccuracy report — just a thumbs-down. Reasons might include bad phrasing, not fun, too ambiguous. Feedback stored in Firestore (`/flaggedQuestions`) with: `{ sessionId, questionText, topic, difficulty, flaggedAt }`. Flagged questions are down-ranked (not hard-excluded) from future bank draws — they can still appear if there aren't enough alternatives. No user identification required. |

---

### v1.12 — Admin Panel
*All admin functions grouped behind a single gate. Themes (v1.13) depend on this existing first.*

**Authentication approach:** A simple password-protected admin route (`?admin=1` or `/admin`) rather than a full login system. Admin page is a separate HTML file or a hidden screen that checks a hardcoded passphrase stored in the app config. No user account system needed at this stage — the complexity of a full auth system isn't worth it for a single-admin family app. Can revisit if multiple admins are ever needed.

| # | Feature | Detail |
|---|---------|--------|
| 9 | **Admin gate** | Hidden admin screen accessible via special URL parameter or link. Password-checked client-side (acceptable for low-stakes family tool) or validated against a Firestore config document. |
| 10 | **View error logs** | Surface Cloud Function errors and client-side errors written to a Firestore `/logs` collection. Show timestamp, error message, stack if available. |
| 11 | **View stored question topics** | List all topic+difficulty combinations in the question bank (from Firestore or a global bank), with count of questions stored and count flagged. |
| 12 | **View flagged questions** | Table of 👎-flagged questions with topic, difficulty, question text, flag count, and date. Actions: dismiss flag (keep question), delete question from bank, or mark for AI revision. Export as CSV for bulk cleanup. |

---

### v1.13 — Themes (Promoted Topics)
*Depends on admin panel (v1.12). Host-facing feature that reduces AI calls for popular topics.*

| # | Feature | Detail |
|---|---------|--------|
| 13 | **Admin defines promoted topics ("themes")** | In the admin panel, admin can create named themes (e.g. "Animals 🐘", "Disney 🏰", "Space 🚀"). When a theme is saved, the system immediately triggers AI question generation for **every difficulty level** currently in the app. If difficulty levels are added later, the system detects the gap and fetches questions for the missing levels automatically. Questions stored in Firestore under `/themes/{themeId}/questions`. |
| 14 | **Themes shown on host setup page** | Up to 3 promoted themes displayed as tap-to-select cards below the topic input field on the host setup screen. Selecting a theme prefills the topic field and pulls questions from the server — no AI call needed during game creation (unless the stored count is below the requested question count, in which case more are generated and added). |

---

### v1.14 — Smart Question History (Per-Host)
*Question deprioritization scoped to the device/host, not globally.*

| # | Feature | Detail |
|---|---------|--------|
| 15 | **Host-scoped question repeat avoidance** | Questions seen while this device was the host are deprioritized in future games. Identity: Firebase anonymous UID (already persistent via IndexedDB). The existing `QuestionBank` localStorage structure already tracks `seenDate` per question — this release ties that history to the host's UID so it survives page reloads but resets if the user clears browser storage (acceptable, as the user is treated as new). Questions are never hard-excluded — they just rank lower than unseen questions of the same topic/difficulty. |

---

## Open Questions / Decisions Needed Before Building

| Item | Question |
|------|----------|
| v1.8 vote to kick host | If the new randomly-chosen host doesn't have the game on their screen, do we auto-navigate them? |
| v1.8 auto-kick | Show a warning to the host before auto-kicking ("Player X has missed 2 questions — kick them?") or silent? |
| v1.9 rejoin | If the session has moved to `finished`, do we show the final results or redirect home? |
| v1.12 admin gate | Password stored where — hardcoded in app.js, environment variable in the function, or Firestore config doc? |
| v1.13 themes | Who triggers the re-generation check when a new difficulty is added — admin manually, or automatic on admin page load? |

---

## Ungrouped / Future Ideas
- Dark mode
- Emoji reactions during questions (👍 😱 🤔)
- Host preview of generated questions before the game starts
- Custom question sets (host uploads their own Q&A)
- AI revision of 👎-flagged questions (replace poor questions with improved versions, keep the rest)
