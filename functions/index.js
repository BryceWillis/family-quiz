const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

const DIFFICULTY_PROMPTS = [
  'easy — very straightforward, suitable for ages 6 and up, obvious answers',
  'normal — some general knowledge needed, accessible to most people',
  'challenging — requires solid knowledge, will stump many adults',
  'difficult — obscure and expert-level, will challenge even well-read adults',
];

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
    return { questions: JSON.parse(text) };
  }
);
