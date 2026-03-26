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

### v1.13 — Session Resilience (Rejoin)
*More complex — requires persistent session awareness and reconnect logic.*

| # | Feature | Detail |
|---|---------|--------|
| 6 | **Rejoin game in progress** | If a player navigates away, closes the tab, or loses connection, they can return to the home URL or the game-specific share link and be dropped back into the active game automatically. They miss points for any questions that passed while they were gone. If a question is currently in progress when they rejoin, they wait on a "rejoining" screen until the host advances to the next question. If the session has moved to `finished`, they are shown the final scores screen. |

**Identity approach for rejoin:**
Firebase Anonymous Authentication already creates a stable, long-lived user ID (stored in the browser's IndexedDB by the Firebase SDK). This persists across page refreshes and browser restarts until the user clears their browser data. No additional cookie needed — `auth.currentUser.uid` is the persistent device-level identity. On app load, we check localStorage for `{ sessionId, gameCode }` and verify the session is still active in Firestore with that UID still in the players subcollection.

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

### v1.17 — Smart Question History (Per-Host)
*Question deprioritization scoped to the device/host, not globally.*

| # | Feature | Detail |
|---|---------|--------|
| 14 | **Host-scoped question repeat avoidance** | Questions seen while this device was the host are deprioritized in future games. Identity: Firebase anonymous UID (already persistent via IndexedDB). The existing `QuestionBank` localStorage structure already tracks `seenDate` per question — this release ties that history to the host's UID so it survives page reloads but resets if the user clears browser storage (acceptable, as the user is treated as new). Questions are never hard-excluded — they just rank lower than unseen questions of the same topic/difficulty. |

---

### v1.18 — Security Audit & Hardening
*Full review of client JS, Firestore rules, and Cloud Functions for exploitable vulnerabilities.*

**Scope:** This app is publicly accessible, uses anonymous auth, and stores shared data (question bank, session data). The goal is to prevent abuse, data tampering, and unexpected cost.

| # | Area | Concern | Proposed Fix |
|---|------|---------|--------------|
| 15 | **Firestore rules — sessions** | Any authenticated user can write any field on any session (not just their own). A malicious client could set another game's `status`, `currentQuestion`, or scores. | Lock writes: session doc writable only by the host UID; player sub-docs writable only by the matching player UID. Host UID stored at session creation and checked in rules. |
| 16 | **Firestore rules — question bank** | Any authenticated user can write to `/questionBank`, meaning a bad actor could corrupt shared questions or inject malicious content into the shared bank. | Make `/questionBank` server-write-only (only Cloud Functions can write via `firebase-admin`); clients get read access only. Remove `write` from client rules for this collection. |
| 17 | **Firestore rules — flaggedQuestions** | Clients can read all flagged questions. No delete rule exists, but the collection leaks report data publicly to any signed-in user. | Read access is fine (low sensitivity), but confirm delete is blocked — currently it is (no `delete` rule). No change needed unless admin panel is added. |
| 18 | **Cloud Function — generateQuestions** | No rate limiting per user. A single UID could call `generateQuestions` thousands of times, running up Anthropic API costs. | Add per-UID rate limiting: track call timestamps in Firestore or use Firebase App Check to restrict calls to the real app clients only. App Check is the simpler solution. |
| 19 | **Banned word bypass** | Banned word regex uses `\b` word boundaries, which may not catch transliterations, leet speak, or compound words. Scope is best-effort for a family app, not strict content moderation. | Accept current approach as sufficient for a family audience. Document the limitation. Optionally pass topic through the Cloud Function (server-side check) so the list is not visible in client JS. |
| 20 | **Anthropic API key** | API key is stored as a Firebase Secret (`defineSecret`) and never exposed to the client — already correctly handled. | No change needed. Confirm key is not in source control (`.env`, `functions/.env`). |
| 21 | **Session hijack via shared game code** | 4-character game codes (26^4 = 456,976 combinations) are guessable by brute force. A bot could join any active game. | Mitigations: (a) codes are short-lived (game finishes in ~15 min); (b) hosts see the player list and can kick. Low risk for family use. Could add `joinedAt` rate limiting per UID as a stretch goal. |
| 22 | **XSS — player names and topics** | Player names and topics are rendered as `textContent` (not `innerHTML`) throughout the app — no XSS risk from those fields. Question text uses `textContent` too. | Audit all DOM write points to confirm no `innerHTML` assignments use user-supplied content. Fix any found. |
| 23 | **Client-side score manipulation** | Scores are written by each client to their own player doc. A client could write an inflated score directly to Firestore. | Move score calculation server-side: Cloud Function (or Firestore trigger) calculates scores based on answer + timestamp, writes the result. Clients submit their answer choice only. |

**Recommended order of implementation:** #16 (question bank write rules) → #15 (session write rules) → #23 (server-side scoring) → #18 (App Check / rate limiting) → #22 (XSS audit). Items #19–21 are low-risk / no-change.

**Open questions before building:**
- For #15 (session rules): should spectators (non-players who join via the share link but don't enter a name) be allowed any write access?
- For #23 (server-side scoring): this requires a Cloud Function or Firestore trigger to run on every answer submission — acceptable latency for the results screen delay?

---

## Open Questions / Decisions Needed Before Building

| Item | Question |
|------|----------|
| v1.12 vote to kick host | When a new host is randomly assigned mid-game, do their host controls appear in-place (skip button, next button, etc.) or do we navigate them to a confirmation screen first? |

---

## Ungrouped / Future Ideas
- Dark mode
- Emoji reactions during questions (👍 😱 🤔)
- Host preview of generated questions before the game starts
- Custom question sets (host uploads their own Q&A)
- AI revision of 👎-flagged questions (replace poor questions with improved versions, keep the rest)
