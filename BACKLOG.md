# Family Quiz — Feature Backlog

## Proposed Releases

---

### v1.8 — Moderation Controls
*Both items are about controlling who's in the room and who's running it. They share the same Firestore operations (removing/replacing players) and the same lobby/in-game UI surface.*

| # | Feature | Notes |
|---|---------|-------|
| 1 | **Host can kick a player** | Button per player in host lobby/in-game view. Removes player doc from Firestore, notifies remaining players. Inactivity could be auto-detected (no answers for N rounds). |
| 2 | **Players vote to kick host** | Any player can initiate; unanimous vote required. If host is kicked, either the game ends or longest-joined player is promoted to host. |

---

### v1.9 — Session Resilience
*Standalone and more technically involved — requires persisting enough state to reconnect a player to an active game. Keeping it separate lets it be tested thoroughly.*

| # | Feature | Notes |
|---|---------|-------|
| 3 | **Rejoin game in progress** | If a player navigates away or loses connection mid-game, detect their previous session (via localStorage userId + code) and drop them back into the current question. Host should not be able to start without them being able to rejoin. |

---

### v1.10 — Polish & Accessibility
*Both are small, low-risk, and improve the day-to-day experience without touching game logic. Good candidates to batch.*

| # | Feature | Notes |
|---|---------|-------|
| 4 | **Share text includes topic** | When the host copies the join link, the clipboard text becomes something like: *"Join our Family Quiz about 'Animals'! Use code ABCD or tap: https://..."* instead of just the raw URL. |
| 5 | **TTS highlights as it reads** | As the screen reader reads the question and each answer option, the corresponding text is highlighted (bold/background colour). Helps emergent readers follow along. Requires syncing highlight timing to `SpeechSynthesisUtterance` word/boundary events. |

---

### v1.11 — Content Quality
*Involves a data pipeline (flag → storage → export) that doesn't exist yet. Keeping it separate avoids scope creep on other releases.*

| # | Feature | Notes |
|---|---------|-------|
| 6 | **Flag inaccurate question** | Players can flag a question during results. Flag is written to Firestore (`/flaggedQuestions`). Flagged questions are excluded from future question bank draws. Host (or you) can export the flag list for manual review and cleanup. |

---

## Individual Item Notes

### Kick Player (v1.8)
- Inactivity threshold: auto-flag after missing 2+ consecutive questions with no answer?
- Or purely manual: host sees a ⚠️ badge next to idle players and can kick at will

### Vote to Kick Host (v1.8)
- What happens after kick? Options: (a) game ends, (b) next player by join order becomes host
- Unanimous = all non-host players must agree within a time window (30s?)

### Rejoin (v1.9)
- Store `{ sessionId, userId }` in localStorage on join
- On load, check if that session is still `active` and userId still in players subcollection
- If yes, skip home screen and drop straight into the current question/results screen

### TTS Highlight (v1.10)
- `SpeechSynthesisUtterance` fires `boundary` events with `charIndex`
- Can use this to highlight the word being spoken in real time
- Simpler fallback: highlight the whole answer option as it starts being read

### Flag Question (v1.11)
- Flag stored as: `{ sessionId, questionText, topic, difficulty, flaggedBy, flaggedAt }`
- Export: simple Firebase Console query or a small admin page
- Question bank draw: check flagged list before selecting questions

---

## Ungrouped / Future
*(Not yet scoped)*

- Dark mode
- Emoji reactions during questions (👍😱🤔)
- Host preview of generated questions before starting
- Custom question sets (host uploads their own questions)
