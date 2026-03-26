// v2
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

const DIFFICULTY_PROMPTS = [
  'easy — very straightforward, suitable for ages 6 and up, obvious answers',
  'normal — some general knowledge needed, accessible to most people',
  'challenging — requires solid knowledge, will stump many adults',
  'difficult — obscure and expert-level, will challenge even well-read adults',
];

// Words that must not appear in stored questions.
const BANNED_WORDS_RE = /\b(donald|trump|elon|musk|fuck|shit|ass|nigger|negro|bitch|cunt)\b/i;
function questionContainsBannedWord(q) {
  return [q.question, q.explanation, ...(q.options || [])]
    .some(f => f && BANNED_WORDS_RE.test(f));
}

exports.generateQuestions = onCall(
  { secrets: [anthropicKey], region: 'us-east1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in');
    }

    const { topic, count, difficulty } = request.data;

    if (!topic || typeof topic !== 'string' || topic.length > 100) {
      throw new HttpsError('invalid-argument', 'Invalid topic');
    }
    if (typeof count !== 'number' || count < 1 || count > 30) {
      throw new HttpsError('invalid-argument', 'Invalid count');
    }
    if (typeof difficulty !== 'number' || difficulty < 0 || difficulty > 3) {
      throw new HttpsError('invalid-argument', 'Invalid difficulty');
    }

    const diffPrompt = DIFFICULTY_PROMPTS[difficulty];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         anthropicKey.value(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-6',
        max_tokens: 2048,
        messages: [{
          role:    'user',
          content: `Create ${count} multiple-choice quiz questions about "${topic}".

Difficulty level: ${diffPrompt}

Requirements:
- 4 answer choices per question
- One clearly correct answer
- Brief, cheerful explanation for why the answer is correct (1-2 sentences)
- Match the difficulty level precisely — don't make hard questions easy or vice versa

Return ONLY a valid JSON array — no markdown, no explanation, just the JSON:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correct": 0,
    "explanation": "..."
  }
]

The "correct" field is the 0-based index (0=first option, 1=second, 2=third, 3=fourth).`,
        }],
      }),
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const err = await res.json(); msg = err.error?.message || msg; } catch {}
      throw new HttpsError('internal', msg);
    }

    const data = await res.json();
    let text = data.content[0].text.trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const questions = JSON.parse(text);

    // Filter banned words server-side before storing
    const clean = questions.filter(q => !questionContainsBannedWord(q));

    // Store clean questions in the shared bank (server-side, authoritative)
    try {
      const db = admin.firestore();
      const firestoreKey = `${topic.toLowerCase().trim()}_${difficulty}`;
      const docRef = db.collection('questionBank').doc(firestoreKey);
      await db.runTransaction(async tx => {
        const snap = await tx.get(docRef);
        const existing = snap.exists ? (snap.data().questions || []) : [];
        const existingTexts = new Set(existing.map(q => q.question.toLowerCase().trim()));
        const toAdd = clean.filter(q => !existingTexts.has(q.question.toLowerCase().trim()));
        if (toAdd.length === 0) return;
        tx.set(docRef, {
          topic,
          difficulty,
          questions: [...existing, ...toAdd],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch (e) {
      // Non-fatal — client still gets the questions for this game
      console.warn('generateQuestions: bank storage failed:', e);
    }

    return { questions: clean };
  }
);

// Update upvote/downvote counts for a question in the shared bank.
exports.submitVote = onCall(
  { region: 'us-east1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in');
    }

    const { topic, difficulty, questionText, oldVote, newVote } = request.data;

    if (!topic || typeof topic !== 'string' || topic.length > 100) {
      throw new HttpsError('invalid-argument', 'Invalid topic');
    }
    if (typeof difficulty !== 'number' || difficulty < 0 || difficulty > 3) {
      throw new HttpsError('invalid-argument', 'Invalid difficulty');
    }
    if (!questionText || typeof questionText !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid question');
    }
    const validVotes = new Set([null, 'up', 'down']);
    if (!validVotes.has(oldVote) || !validVotes.has(newVote)) {
      throw new HttpsError('invalid-argument', 'Invalid vote value');
    }

    const db = admin.firestore();
    const firestoreKey = `${topic.toLowerCase().trim()}_${difficulty}`;
    const docRef = db.collection('questionBank').doc(firestoreKey);
    const qKey = questionText.toLowerCase().trim();

    try {
      await db.runTransaction(async tx => {
        const snap = await tx.get(docRef);
        if (!snap.exists) return;
        const questions = [...(snap.data().questions || [])];
        const q = questions.find(q => q.question.toLowerCase().trim() === qKey);
        if (!q) return;

        q.upvotes   = q.upvotes   || 0;
        q.downvotes = q.downvotes || 0;

        if (oldVote === 'up')   q.upvotes   = Math.max(0, q.upvotes - 1);
        if (oldVote === 'down') q.downvotes = Math.max(0, q.downvotes - 1);
        if (newVote === 'up')   q.upvotes++;
        if (newVote === 'down') q.downvotes++;
        q.score = q.upvotes - q.downvotes;

        tx.update(docRef, { questions, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      });
    } catch (e) {
      console.warn('submitVote: transaction failed:', e);
    }
  }
);

// Auto-close sessions that are more than 7 days old and not already in a terminal state
const TERMINAL_STATUSES = new Set(['finished', 'ended-manual', 'ended-auto']);

exports.cleanupOldSessions = onSchedule(
  { schedule: 'every 24 hours', region: 'us-east1' },
  async () => {
    const db = admin.firestore();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const snap = await db.collection('sessions')
      .where('createdAt', '<', cutoff)
      .get();

    const toClose = snap.docs.filter(d => !TERMINAL_STATUSES.has(d.data().status));

    if (toClose.length === 0) {
      console.log('cleanupOldSessions: nothing to close');
      return;
    }

    const batch = db.batch();
    toClose.forEach(doc => batch.update(doc.ref, {
      status: 'ended-auto',
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
    }));
    await batch.commit();
    console.log(`cleanupOldSessions: auto-closed ${toClose.length} stale sessions`);
  }
);
