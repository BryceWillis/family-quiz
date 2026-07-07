const test = require('node:test');
const assert = require('node:assert');

const { __test } = require('../index.js');

test('index.js loads offline and exposes test helpers', () => {
  assert.ok(__test, '__test export missing');
  assert.strictEqual(typeof __test.questionContainsBannedWord, 'function');
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
