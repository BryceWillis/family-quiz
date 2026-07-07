const test = require('node:test');
const assert = require('node:assert');

const { __test } = require('../index.js');

test('index.js loads offline and exposes test helpers', () => {
  assert.ok(__test, '__test export missing');
  assert.strictEqual(typeof __test.questionContainsBannedWord, 'function');
});

// Verbatim copy of QuestionBank._firestoreKey from public/app.js — the
// oracle the server-side key must match, since clients read bank docs
// directly with this key.
function clientFirestoreKey(topic, difficulty) {
  const t = topic.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').slice(0, 60);
  return `${t}_d${difficulty}`;
}

test('firestoreKey', async (t) => {
  await t.test('simple topic', () => {
    assert.strictEqual(__test.firestoreKey('Animals', 0), 'animals_d0');
  });

  await t.test('AC/DC contains no slash (valid Firestore doc ID)', () => {
    const key = __test.firestoreKey('AC/DC', 3);
    assert.strictEqual(key, 'ac_dc_d3');
    assert.ok(!key.includes('/'));
  });

  await t.test('matches client key for spaces, punctuation, unicode, long topics', () => {
    const topics = [
      'Animals',
      'World History',
      '  Space Exploration  ',
      'Sports & Games!',
      'AC/DC',
      'Café Münchën',
      '90s Pop-Music',
      'a'.repeat(70),
      'The Absolutely Enormous Topic Name That Goes On And On Well Past Sixty Characters',
    ];
    for (const topic of topics) {
      for (const difficulty of [0, 1, 2, 3]) {
        assert.strictEqual(
          __test.firestoreKey(topic, difficulty),
          clientFirestoreKey(topic, difficulty),
          `mismatch for topic ${JSON.stringify(topic)} d${difficulty}`
        );
      }
    }
  });

  await t.test('caps topic portion at 60 chars', () => {
    const key = __test.firestoreKey('x'.repeat(200), 2);
    assert.strictEqual(key, 'x'.repeat(60) + '_d2');
  });
});

function goodQuestion(overrides = {}) {
  return {
    question: 'What do bees make?',
    options: ['Honey', 'Milk', 'Silk', 'Wax'],
    correct: 0,
    explanation: 'Bees convert nectar into honey.',
    ...overrides,
  };
}

test('validateQuestion', async (t) => {
  await t.test('accepts a well-formed question', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion()), true);
  });

  await t.test('rejects 3 options', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ options: ['A', 'B', 'C'] })), false);
  });

  await t.test('rejects 5 options', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ options: ['A', 'B', 'C', 'D', 'E'] })), false);
  });

  await t.test('rejects correct=4 (out of range)', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ correct: 4 })), false);
  });

  await t.test('rejects correct="0" (string, not integer)', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ correct: '0' })), false);
  });

  await t.test('rejects non-integer correct', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ correct: 1.5 })), false);
  });

  await t.test('rejects empty question text', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ question: '   ' })), false);
  });

  await t.test('rejects an empty option string', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ options: ['Honey', '', 'Silk', 'Wax'] })), false);
  });

  await t.test('rejects missing explanation', () => {
    assert.strictEqual(__test.validateQuestion(goodQuestion({ explanation: undefined })), false);
  });

  await t.test('rejects non-objects', () => {
    assert.strictEqual(__test.validateQuestion(null), false);
    assert.strictEqual(__test.validateQuestion('question'), false);
    assert.strictEqual(__test.validateQuestion([goodQuestion()]), false);
  });
});

test('salvageTruncatedJson', async (t) => {
  await t.test('recovers N-1 questions from an array cut mid-object', () => {
    const full = [goodQuestion(), goodQuestion({ question: 'Q2?' }), goodQuestion({ question: 'Q3?' })];
    const json = JSON.stringify(full);
    // Cut inside the last object, mid-way through its explanation string
    const truncated = json.slice(0, json.lastIndexOf('explanation') + 20);
    const salvaged = __test.salvageTruncatedJson(truncated);
    assert.strictEqual(salvaged.length, 2);
    assert.deepStrictEqual(salvaged, full.slice(0, 2));
  });

  await t.test('recovers questions when cut right after a complete object', () => {
    const full = [goodQuestion(), goodQuestion({ question: 'Q2?' })];
    const json = JSON.stringify(full);
    const truncated = json.slice(0, json.lastIndexOf('}') + 1) + ','; // "…},"
    assert.deepStrictEqual(__test.salvageTruncatedJson(truncated), full);
  });

  await t.test('returns [] for garbage', () => {
    assert.deepStrictEqual(__test.salvageTruncatedJson('sorry, I cannot do that'), []);
    assert.deepStrictEqual(__test.salvageTruncatedJson('{"not": "an array"}'), []);
    assert.deepStrictEqual(__test.salvageTruncatedJson(''), []);
  });
});

test('questionContainsBannedWord', async (t) => {
  await t.test('flags a banned word in the question text', () => {
    assert.strictEqual(__test.questionContainsBannedWord({
      question: 'What did Donald Trump do?',
      options: ['A', 'B', 'C', 'D'],
      explanation: 'x',
    }), true);
  });

  await t.test('flags a banned word in an option', () => {
    assert.strictEqual(__test.questionContainsBannedWord({
      question: 'Who founded SpaceX?',
      options: ['Elon Musk', 'B', 'C', 'D'],
      explanation: 'x',
    }), true);
  });

  await t.test('passes a clean question', () => {
    assert.strictEqual(__test.questionContainsBannedWord({
      question: 'What do bees make?',
      options: ['Honey', 'Milk', 'Silk', 'Wax'],
      explanation: 'Bees make honey.',
    }), false);
  });

  await t.test('does not flag substrings of banned words', () => {
    assert.strictEqual(__test.questionContainsBannedWord({
      question: 'What is a classic dessert?',
      options: ['Trumpet cake', 'B', 'C', 'D'],
      explanation: 'Assistance not needed.',
    }), false);
  });
});
