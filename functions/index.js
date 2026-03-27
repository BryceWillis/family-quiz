// v2
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

const DIFFICULTY_PROMPTS = [
  `EASY — suitable for ages 6 and up.
Ask about well-known, concrete things: familiar animals, colours, food, popular characters, basic geography (capitals of large countries, famous landmarks), obvious real-world facts.
The correct answer should feel satisfying and obvious once you hear it.
Wrong answers: use other plausible things in the same category (if the answer is "lion", wrong answers should be other animals — not "a table"). At least one wrong answer should be something a young child might genuinely consider.
AVOID: dates, large numbers, negative phrasing ("which is NOT"), anything requiring reading or prior study, questions where the answer is in the question text.
Question format examples: "What do bees make?", "Which of these animals has a trunk?", "What colour is a fire engine?"`,

  `MEDIUM — general knowledge accessible to most adults and older teens.
Ask about things a reasonably educated person would know from school, news, or everyday culture — with enough nuance that you might second-guess yourself.
The correct answer should feel like a fair "of course!" moment.
Wrong answers: use common confusions and plausible near-misses. For famous inventions, include other inventors from the same era. For geography, use neighbouring countries or similarly-sized cities. Include at least one common misconception as a distractor.
AVOID: questions where one option is obviously from a completely different category, questions with a silly or joke option.
Question format examples: "How many bones are in the human body?", "Which planet is closest to the Sun?", "In which century was the Eiffel Tower built?"`,

  `HARD — requires solid knowledge of the topic. Will stump most adults.
Go beyond surface familiarity — reward people who have genuinely studied the topic. Ask about specific names, mechanisms, distinctions, or details within the field.
The correct answer should be something an enthusiast knows but a casual person would likely miss.
Wrong answers: make them genuinely competitive. Use facts from the same domain that sound equally plausible. Include at least one answer that represents a commonly-held but incorrect belief. A person who barely knows the topic should find it nearly impossible to identify the correct answer.
AVOID: questions where the answer is obviously unlike the others in type or specificity.
Question format examples: "Which of these was discovered first?", "What is the scientific term for...?", "Which country was the first to...?"`,

  `IMPOSSIBLE — obscure and expert-level. Will challenge even well-read adults.
Ask about edge cases, counterintuitive facts, very specific historical or scientific details, or things that sound wrong but are actually correct.
The correct answer should be genuinely surprising — the kind of thing that makes people say "I had no idea" when they hear the explanation.
Wrong answers: one distractor should be the "obvious" answer that most people would confidently choose but is actually wrong. All distractors should be in the same league as the correct answer — no weak or obviously silly options.
The explanation is especially important at this level: make it reveal why the answer is true and why it is so surprising or counterintuitive.
AVOID: questions that are merely obscure trivia with no interesting insight ("what year was X born") — impossible questions should be hard because the fact is counterintuitive or surprising, not just unknown.
Question format examples: "Which of these widely-held beliefs is actually false?", "What was the original purpose of...?", "Which of these happened first?"`,
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
        max_tokens: 4096,
        messages: [{
          role:    'user',
          content: `Create ${count} multiple-choice quiz questions about "${topic}".

Difficulty level:
${diffPrompt}

Requirements:
- 4 answer choices per question
- Exactly one correct answer
- A brief explanation (1-2 sentences) for why the answer is correct — make it interesting, not just a restatement
- All 4 options must be the same "type" (all countries, all people, all numbers, etc.) — never mix categories
- Wrong answers must be plausible to someone who knows the topic a little — never silly or obviously wrong
- Vary the question format — do not start every question with "What is..." or "Which of the following..."
- Distribute correct answers across all four positions (0, 1, 2, 3) roughly evenly across the set
- Never put the answer in the question text

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
