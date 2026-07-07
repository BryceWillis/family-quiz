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
