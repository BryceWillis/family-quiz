// ============================================================
//  FAMILY QUIZ — app.js
// ============================================================

// ----- SILLY NAMES -----
const ADJECTIVES = [
  'Bouncy','Wiggly','Giggly','Fluffy','Wobbly','Sneaky','Grumpy',
  'Silly','Dizzy','Bubbly','Zippy','Squishy','Floppy','Cheeky',
  'Wacky','Blinky','Jumpy','Sparkly','Goofy','Bumpy','Clumsy',
  'Peppy','Sassy','Zany','Funky',
];
const ANIMALS = [
  'Penguin','Walrus','Flamingo','Panda','Koala','Sloth','Platypus',
  'Narwhal','Capybara','Wombat','Quokka','Llama','Toucan','Meerkat',
  'Otter','Hedgehog','Axolotl','Armadillo','Blobfish','Gecko',
  'Salamander','Tapir','Binturong','Marmot','Alpaca',
];

// ----- VERSION HISTORY -----
const VERSIONS = [
  {
    version: '1.5',
    label: 'v1.5 — Analytics',
    date: 'March 2026',
    changes: [
      'Added Google Analytics via Firebase Analytics',
      'Removed auto-playing text-to-speech — now manual only',
    ],
  },
  {
    version: '1.4',
    label: 'v1.4 — Navigation Fix',
    date: 'March 2026',
    changes: [
      'Fixed host getting stuck on scoreboard after clicking Next Question',
      'Both host and players now navigate via real-time Firestore watchers',
    ],
  },
  {
    version: '1.3',
    label: 'v1.3 — Read Aloud',
    date: 'March 2026',
    changes: [
      'Added 🔊 Read Aloud button on question screen',
      'Tap again to stop mid-read',
      'Great for younger players who are still learning to read',
    ],
  },
  {
    version: '1.2',
    label: 'v1.2 — Question Bank',
    date: 'March 2026',
    changes: [
      'Questions are now cached locally so the AI is called less often',
      'Unseen questions are always shown first',
      'Oldest questions get recycled when the bank runs low',
    ],
  },
  {
    version: '1.1',
    label: 'v1.1 — Difficulty Levels',
    date: 'March 2026',
    changes: [
      'Added difficulty slider: Easy, Medium, Difficult, Impossible',
      'Claude tailors question complexity to the chosen level',
      'API key is now saved so you only type it once',
    ],
  },
  {
    version: '1.0',
    label: 'v1.0 — Initial Release',
    date: 'March 2026',
    changes: [
      'Real-time multiplayer quiz on any topic',
      'Claude AI generates fresh questions for every game',
      'Anonymous sign-in with silly animal names',
      'Synchronized countdown timer across all devices',
      'Live leaderboard after every question',
    ],
  },
];

// ----- DIFFICULTY -----
const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Difficult', 'Impossible'];
// What we tell the AI for each level
const DIFFICULTY_PROMPTS = [
  'easy — very straightforward, suitable for ages 6 and up, obvious answers',
  'normal — some general knowledge needed, accessible to most people',
  'challenging — requires solid knowledge, will stump many adults',
  'difficult — obscure and expert-level, will challenge even well-read adults',
];

// ----- STATE -----
const state = {
  userId:         null,
  sillyName:      null,
  sessionId:      null,
  isHost:         false,
  unsubscribers:  [],
  timerInterval:  null,
  endingQuestion: false,
};

let db, auth;

// ============================================================
//  HELPERS
// ============================================================

const delay = ms => new Promise(r => setTimeout(r, ms));

function generateSillyName() {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function cleanup() {
  state.unsubscribers.forEach(fn => fn && fn());
  state.unsubscribers  = [];
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  TTS.stop();
  state.endingQuestion = false;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

function showError(msg) { alert(msg); }

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ============================================================
//  QUESTION BANK  (localStorage)
// ============================================================
//  Structure: fq_question_bank = { "topic||diff": [ {question,options,correct,
//             explanation,topic,difficulty,seenDate:null|"YYYY-MM-DD"}, ... ] }

const QuestionBank = {
  _key: 'fq_question_bank',

  load() {
    try { return JSON.parse(localStorage.getItem(this._key) || '{}'); }
    catch { return {}; }
  },

  save(bank) {
    localStorage.setItem(this._key, JSON.stringify(bank));
  },

  _bankKey(topic, difficulty) {
    return `${topic.toLowerCase().trim()}||${difficulty}`;
  },

  /** Return up to `count` questions for topic+difficulty, preferring unseen ones. */
  get(topic, difficulty, count) {
    const bank = this.load();
    const key  = this._bankKey(topic, difficulty);
    const pool = bank[key] || [];
    if (pool.length === 0) return [];

    const unseen = pool.filter(q => !q.seenDate);
    const seen   = pool.filter(q =>  q.seenDate)
      .sort((a, b) => new Date(a.seenDate) - new Date(b.seenDate));

    // Shuffle unseen for variety
    for (let i = unseen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
    }
    // Light shuffle of seen (swap neighbours ~30% of the time)
    for (let i = 0; i < seen.length - 1; i++) {
      if (Math.random() < 0.3) [seen[i], seen[i + 1]] = [seen[i + 1], seen[i]];
    }

    return [...unseen, ...seen].slice(0, count);
  },

  /** Add new questions to the bank, deduplicating by question text. */
  add(topic, difficulty, questions) {
    const bank = this.load();
    const key  = this._bankKey(topic, difficulty);
    const existing = bank[key] || [];
    const existingTexts = new Set(existing.map(q => q.question.toLowerCase().trim()));

    const toAdd = questions
      .filter(q => !existingTexts.has(q.question.toLowerCase().trim()))
      .map(q => ({ ...q, topic, difficulty, seenDate: null }));

    bank[key] = [...existing, ...toAdd];
    this.save(bank);
  },

  /** Mark a list of question texts as seen today for this topic+difficulty. */
  markSeen(topic, difficulty, questionTexts) {
    const bank = this.load();
    const key  = this._bankKey(topic, difficulty);
    const pool = bank[key] || [];
    const textSet = new Set(questionTexts.map(t => t.toLowerCase().trim()));
    pool.forEach(q => {
      if (textSet.has(q.question.toLowerCase().trim())) q.seenDate = todayStr();
    });
    bank[key] = pool;
    this.save(bank);
  },
};

// ============================================================
//  TEXT-TO-SPEECH
// ============================================================

const TTS = {
  _active: false,

  stop() {
    this._active = false;
    window.speechSynthesis.cancel();
    this._updateBtn();
  },

  _updateBtn() {
    const btn = document.getElementById('tts-repeat-btn');
    if (!btn) return;
    if (this._active) {
      btn.innerHTML = '⏹ Stop';
      btn.classList.add('btn-tts-stop');
    } else {
      btn.innerHTML = '🔊 Read Aloud';
      btn.classList.remove('btn-tts-stop');
    }
  },

  _pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.name === 'Samantha') ||
      voices.find(v => v.name === 'Karen')    ||
      voices.find(v => v.lang === 'en-US' && v.localService) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  },

  speak(text, rate = 0.85, pitch = 1.1) {
    return new Promise(resolve => {
      if (!this._active) { resolve(); return; } // stopped mid-sequence
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate   = rate;
      utter.pitch  = pitch;
      utter.volume = 1;
      const doSpeak = () => {
        const voice = this._pickVoice();
        if (voice) utter.voice = voice;
        utter.onend  = resolve;
        utter.onerror = resolve;
        window.speechSynthesis.speak(utter);
      };
      if (window.speechSynthesis.getVoices().length > 0) doSpeak();
      else window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    });
  },

  async readQuestion(question, options) {
    if (this._active) { this.stop(); return; }   // toggle: stop if already reading
    this._active = true;
    this._updateBtn();
    await delay(200);
    await this.speak(question);
    await delay(400);
    const letters = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < options.length; i++) {
      if (!this._active) break;
      await this.speak(`${letters[i]}: ${options[i]}`);
      await delay(200);
    }
    this._active = false;
    this._updateBtn();
  },

  async readResult(letterAndOption, explanation) {
    if (this._active) this.stop();
    this._active = true;
    this._updateBtn();
    await delay(500);
    await this.speak(`The correct answer is: ${letterAndOption}`);
    if (explanation && this._active) {
      await delay(400);
      await this.speak(explanation);
    }
    this._active = false;
    this._updateBtn();
  },

  async announce(text) {
    if (this._active) this.stop();
    this._active = true;
    this._updateBtn();
    await delay(300);
    await this.speak(text, 0.85, 1.2);
    this._active = false;
    this._updateBtn();
  },
};

// ============================================================
//  AUTH
// ============================================================

async function ensureAuth() {
  if (auth.currentUser) { state.userId = auth.currentUser.uid; return; }
  const cred = await auth.signInAnonymously();
  state.userId = cred.user.uid;
}

// ============================================================
//  CLAUDE API — question generation
// ============================================================

async function generateQuestions(topic, count, difficulty, apiKey) {
  const diffPrompt = DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS[0];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':                              'application/json',
      'x-api-key':                                 apiKey,
      'anthropic-version':                         '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
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
    throw new Error(msg);
  }

  const data = await res.json();
  let text = data.content[0].text.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(text);
}

// ============================================================
//  RENDER HELPERS
// ============================================================

function renderPlayerChips(containerId, players) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = players.map(p =>
    `<div class="player-chip ${p.id === state.userId ? 'me' : ''}">
      ${p.sillyName}${p.id === state.userId ? ' <em>(you)</em>' : ''}
    </div>`
  ).join('');
}

function renderLeaderboard(containerId, players) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = players.map((p, i) =>
    `<div class="lb-row ${p.id === state.userId ? 'lb-me' : ''}">
      <span class="lb-rank">${medals[i] ?? `${i + 1}.`}</span>
      <span class="lb-name">${p.sillyName}${p.id === state.userId ? ' ✨' : ''}</span>
      <span class="lb-score">${p.score} pts</span>
    </div>`
  ).join('');
}

// ============================================================
//  SCREENS
// ============================================================

// ----- HOME -----
function showHome() {
  cleanup();
  state.sessionId = null;
  state.isHost    = false;
  showScreen('screen-home');
  renderRecentSessions('recent-sessions-home');
}

// ----- HOST SETUP -----
function showHostSetup() {
  showScreen('screen-host-setup');

  const savedKey = localStorage.getItem('fq_api_key');
  if (savedKey) document.getElementById('api-key').value = savedKey;

  // Difficulty slider live label
  const slider   = document.getElementById('difficulty');
  const display  = document.getElementById('diff-display');
  const updateDiffLabel = () => {
    display.textContent = DIFFICULTY_LABELS[parseInt(slider.value)];
  };
  slider.oninput = updateDiffLabel;
  updateDiffLabel();

  document.getElementById('host-setup-form').onsubmit = async e => {
    e.preventDefault();
    const hostName   = document.getElementById('host-name').value.trim();
    const topic      = document.getElementById('topic').value.trim();
    const difficulty = parseInt(document.getElementById('difficulty').value);
    const numQ       = parseInt(document.getElementById('num-questions').value);
    const timeQ      = parseInt(document.getElementById('time-per-q').value);
    const apiKey     = document.getElementById('api-key').value.trim();
    if (!hostName || !topic || !apiKey) return;
    localStorage.setItem('fq_api_key', apiKey);
    await startCreateGame(hostName, topic, difficulty, numQ, timeQ, apiKey);
  };
}

async function startCreateGame(hostName, topic, difficulty, numQ, timeQ, apiKey) {
  showScreen('screen-generating');
  document.getElementById('generating-topic').textContent =
    `"${topic}" — ${DIFFICULTY_LABELS[difficulty]}`;

  try {
    await ensureAuth();

    // Try to pull questions from the local bank first
    let questions = QuestionBank.get(topic, difficulty, numQ);
    const fromBank = questions.length;

    if (fromBank < numQ) {
      // Need to generate more — ask AI for the full count (extra go into bank for later)
      const needed = numQ - fromBank;
      const generated = await generateQuestions(topic, needed + 5, difficulty, apiKey);
      QuestionBank.add(topic, difficulty, generated);
      // Re-fetch so selection logic applies to the full pool
      questions = QuestionBank.get(topic, difficulty, numQ);
    }

    // Mark selected questions as seen today
    QuestionBank.markSeen(topic, difficulty, questions.map(q => q.question));

    // Find a unique 4-char game code
    let code;
    for (let i = 0; i < 20; i++) {
      code = generateGameCode();
      const existing = await db.collection('sessions').doc(code).get();
      if (!existing.exists) break;
    }

    state.sillyName = generateSillyName();
    state.sessionId = code;
    state.isHost    = true;

    await db.collection('sessions').doc(code).set({
      hostId:               state.userId,
      hostName,
      status:               'lobby',
      currentQuestionIndex: -1,
      topic,
      difficulty,
      questions,
      timePerQuestion:      timeQ,
      questionStartTime:    null,
      createdAt:            firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('sessions').doc(code)
      .collection('players').doc(state.userId).set({
        sillyName:               state.sillyName,
        displayName:             hostName,
        score:                   0,
        answeredCurrentQuestion: false,
        currentAnswer:           -1,
        lastAnswerCorrect:       null,
        joinedAt:                firebase.firestore.FieldValue.serverTimestamp(),
      });

    showLobbyHost();
  } catch (err) {
    console.error(err);
    showScreen('screen-host-setup');
    showError(`Could not create game: ${err.message}`);
  }
}

// ----- LOBBY (HOST) -----
function showLobbyHost() {
  cleanup();
  showScreen('screen-lobby-host');

  document.getElementById('game-code-display').textContent = state.sessionId;

  const shareLink = `${location.origin}${location.pathname}?code=${state.sessionId}`;
  document.getElementById('share-link').value = shareLink;

  document.getElementById('copy-link-btn').onclick = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      const btn = document.getElementById('copy-link-btn');
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy Link'; }, 2000);
    });
  };

  const sessionRef = db.collection('sessions').doc(state.sessionId);

  const unsub = sessionRef.collection('players').onSnapshot(snap => {
    const players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPlayerChips('host-lobby-players', players);
    document.getElementById('player-count').textContent = players.length;
    document.getElementById('start-btn').disabled = players.length < 2;
  });
  state.unsubscribers.push(unsub);

  document.getElementById('start-btn').onclick = async () => {
    document.getElementById('start-btn').disabled = true;
    const pSnap = await sessionRef.collection('players').get();
    const batch = db.batch();
    pSnap.docs.forEach(doc => batch.update(doc.ref, {
      score: 0, answeredCurrentQuestion: false, currentAnswer: -1, lastAnswerCorrect: null,
    }));
    await batch.commit();
    await sessionRef.update({
      status: 'question', currentQuestionIndex: 0,
      questionStartTime: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // Navigation handled by watcher below
  };

  // Host watches for game start (same pattern as player)
  const startWatchUnsub = sessionRef.onSnapshot(snap => {
    const data = snap.data();
    if (!data) return;
    if (data.status === 'question') { cleanup(); showQuestion(data); }
  });
  state.unsubscribers.push(startWatchUnsub);
}

// ----- JOIN -----
function showJoin() {
  showScreen('screen-join');
  const code = new URLSearchParams(location.search).get('code');
  if (code) document.getElementById('join-code').value = code.toUpperCase();

  document.getElementById('join-form').onsubmit = async e => {
    e.preventDefault();
    const name = document.getElementById('player-name').value.trim();
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (!name || !code) return;
    await joinGame(name, code);
  };
}

async function joinGame(playerName, code) {
  try {
    await ensureAuth();
    const sessionRef = db.collection('sessions').doc(code);
    const snap = await sessionRef.get();
    if (!snap.exists) { showError('Game not found! Check the code and try again.'); return; }
    const session = snap.data();
    if (session.status !== 'lobby') { showError('This game has already started!'); return; }

    state.sillyName = generateSillyName();
    state.sessionId = code;
    state.isHost    = false;

    await sessionRef.collection('players').doc(state.userId).set({
      sillyName: state.sillyName, displayName: playerName,
      score: 0, answeredCurrentQuestion: false,
      currentAnswer: -1, lastAnswerCorrect: null,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showLobbyPlayer();
  } catch (err) { showError(`Could not join: ${err.message}`); }
}

// ----- LOBBY (PLAYER) -----
function showLobbyPlayer() {
  cleanup();
  showScreen('screen-lobby-player');
  document.getElementById('my-silly-name').textContent    = state.sillyName;
  document.getElementById('player-game-code').textContent = state.sessionId;

  const sessionRef = db.collection('sessions').doc(state.sessionId);
  const unsub1 = sessionRef.onSnapshot(snap => {
    const data = snap.data();
    if (!data) return;
    if (data.status === 'question') { cleanup(); showQuestion(data); }
  });
  state.unsubscribers.push(unsub1);
  const unsub2 = sessionRef.collection('players').onSnapshot(snap => {
    renderPlayerChips('player-lobby-list', snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  state.unsubscribers.push(unsub2);
}

// ----- QUESTION -----
function showQuestion(sessionData) {
  cleanup();
  showScreen('screen-question');
  state.endingQuestion = false;

  const { questions, currentQuestionIndex: qIdx, timePerQuestion, questionStartTime } = sessionData;
  const q       = questions[qIdx];
  const total   = questions.length;
  const letters = ['A', 'B', 'C', 'D'];

  document.getElementById('q-progress').textContent = `Question ${qIdx + 1} / ${total}`;
  document.getElementById('q-text').textContent     = q.question;
  document.getElementById('waiting-indicator').style.display = 'none';

  // Build answer buttons
  const optionsEl = document.getElementById('answer-options');
  optionsEl.innerHTML = '';
  let hasAnswered = false;

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = `option-btn opt-${letters[i].toLowerCase()}`;
    btn.innerHTML = `<span class="opt-badge">${letters[i]}</span><span class="opt-text">${opt}</span>`;
    btn.onclick = async () => {
      if (hasAnswered) return;
      hasAnswered = true;
      document.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; b.classList.add('dimmed'); });
      btn.classList.remove('dimmed');
      btn.classList.add('chosen');
      document.getElementById('waiting-indicator').style.display = 'flex';
      await db.collection('sessions').doc(state.sessionId)
        .collection('players').doc(state.userId)
        .update({ currentAnswer: i, answeredCurrentQuestion: true });
    };
    optionsEl.appendChild(btn);
  });

  // TTS — manual only, button toggles read/stop
  document.getElementById('tts-repeat-btn').onclick = () => TTS.readQuestion(q.question, q.options);

  // Timer
  startTimer(timePerQuestion, questionStartTime, qIdx);

  // Host-only controls
  const hostPanel = document.getElementById('host-q-panel');
  if (state.isHost) {
    hostPanel.style.display = 'flex';
    document.getElementById('skip-btn').onclick = () => endQuestion(qIdx);

    // Auto-advance when ALL players have answered
    const sessionRef = db.collection('sessions').doc(state.sessionId);
    const autoUnsub = sessionRef.collection('players').onSnapshot(async snap => {
      const players = snap.docs.map(d => d.data());
      if (players.length > 0 && players.every(p => p.answeredCurrentQuestion)) {
        await delay(1200);
        await endQuestion(qIdx);
      }
    });
    state.unsubscribers.push(autoUnsub);
  } else {
    hostPanel.style.display = 'none';
  }

  // All clients (host AND player) watch for status changes
  const sessionRef = db.collection('sessions').doc(state.sessionId);
  const watchUnsub = sessionRef.onSnapshot(snap => {
    const data = snap.data();
    if (!data) return;
    if (data.status === 'results' && data.currentQuestionIndex === qIdx) {
      cleanup(); showResults(data);
    } else if (data.status === 'finished') {
      cleanup(); showFinal();
    } else if (data.status === 'question' && data.currentQuestionIndex !== qIdx) {
      cleanup(); showQuestion(data);
    }
  });
  state.unsubscribers.push(watchUnsub);
}

function startTimer(duration, startTime, qIdx) {
  const fill   = document.getElementById('timer-fill');
  const secsEl = document.getElementById('timer-seconds');

  let startMs;
  if (startTime && typeof startTime.toMillis === 'function') {
    startMs = startTime.toMillis();
  } else if (startTime && startTime.seconds) {
    startMs = startTime.seconds * 1000 + Math.floor((startTime.nanoseconds || 0) / 1e6);
  } else {
    startMs = Date.now();
  }
  const endMs = startMs + duration * 1000;

  state.timerInterval = setInterval(async () => {
    const remaining = Math.max(0, (endMs - Date.now()) / 1000);
    const pct = (remaining / duration) * 100;
    fill.style.width = `${pct}%`;
    fill.className   = 'timer-fill ' + (pct > 50 ? 'green' : pct > 25 ? 'orange' : 'red');
    secsEl.textContent = Math.ceil(remaining);
    if (remaining <= 0 && state.isHost) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      await endQuestion(qIdx);
    }
  }, 100);
}

async function endQuestion(qIdx) {
  if (state.endingQuestion) return;
  state.endingQuestion = true;
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }

  const sessionRef  = db.collection('sessions').doc(state.sessionId);
  const sessionSnap = await sessionRef.get();
  const session     = sessionSnap.data();
  if (!session || session.status !== 'question' || session.currentQuestionIndex !== qIdx) {
    state.endingQuestion = false; return;
  }

  const correctIdx = session.questions[qIdx].correct;
  const pSnap = await sessionRef.collection('players').get();
  const batch = db.batch();
  pSnap.docs.forEach(doc => {
    const p         = doc.data();
    const isCorrect = p.currentAnswer === correctIdx;
    batch.update(doc.ref, {
      lastAnswerCorrect: isCorrect,
      score: firebase.firestore.FieldValue.increment(isCorrect ? 100 : 0),
    });
  });
  await batch.commit();
  await sessionRef.update({ status: 'results' });
  state.endingQuestion = false;
  // The session watcher in showQuestion fires for everyone (host + player)
  // and calls showResults — no direct navigation needed here
}

// ----- ROUND RESULTS -----
async function showResults(sessionData) {
  cleanup();
  showScreen('screen-round-results');

  const { questions, currentQuestionIndex: qIdx } = sessionData;
  const q             = questions[qIdx];
  const letters       = ['A', 'B', 'C', 'D'];
  const correctLetter = letters[q.correct];
  const correctText   = q.options[q.correct];

  document.getElementById('results-q-label').textContent = `Question ${qIdx + 1} of ${questions.length}`;
  document.getElementById('correct-answer').innerHTML =
    `<span class="answer-badge">${correctLetter}</span>${correctText}`;
  document.getElementById('results-explanation').textContent = q.explanation || '';

  const pSnap   = await db.collection('sessions').doc(state.sessionId).collection('players').get();
  const players = pSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.score - a.score);

  const correct = players.filter(p => p.currentAnswer === q.correct);
  document.getElementById('who-got-it').innerHTML = correct.length === 0
    ? '<p class="no-one">Nobody got this one — tricky!</p>'
    : correct.map(p => `<div class="got-it-chip">✅ ${p.sillyName}</div>`).join('');

  renderLeaderboard('results-leaderboard', players);

  const sessionRef = db.collection('sessions').doc(state.sessionId);
  const isLast     = qIdx >= questions.length - 1;

  if (state.isHost) {
    document.getElementById('host-results-panel').style.display = 'block';
    document.getElementById('player-waiting-msg').style.display = 'none';

    const nextBtn = document.getElementById('next-btn');
    nextBtn.textContent = isLast ? '🏆 Show Final Scores' : '▶️ Next Question';
    nextBtn.disabled    = false;

    nextBtn.onclick = async () => {
      nextBtn.disabled = true;
      if (isLast) {
        await sessionRef.update({ status: 'finished' });
      } else {
        const pSnap2 = await sessionRef.collection('players').get();
        const batch  = db.batch();
        pSnap2.docs.forEach(doc => batch.update(doc.ref, {
          answeredCurrentQuestion: false, currentAnswer: -1, lastAnswerCorrect: null,
        }));
        await batch.commit();
        await sessionRef.update({
          status: 'question',
          currentQuestionIndex: qIdx + 1,
          questionStartTime: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
      // Navigation for host is handled by the watcher below — same as player
    };

    document.getElementById('host-results-panel').style.display = 'block';
    document.getElementById('player-waiting-msg').style.display = 'none';
  } else {
    document.getElementById('host-results-panel').style.display = 'none';
    document.getElementById('player-waiting-msg').style.display = 'block';
  }

  // Both host AND player watch for the next state — this is what actually navigates
  const unsub = sessionRef.onSnapshot(snap => {
    const data = snap.data();
    if (!data) return;
    if (data.status === 'question') { cleanup(); showQuestion(data); }
    else if (data.status === 'finished') { cleanup(); showFinal(); }
  });
  state.unsubscribers.push(unsub);

  renderRecentSessions('recent-sessions-results');
}

// ----- FINAL -----
async function showFinal() {
  cleanup();
  showScreen('screen-final');

  const pSnap   = await db.collection('sessions').doc(state.sessionId).collection('players').get();
  const players = pSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.score - a.score);
  const winner  = players[0];

  document.getElementById('winner-name').textContent  = winner?.sillyName ?? '???';
  document.getElementById('winner-score').textContent = `${winner?.score ?? 0} points`;
  renderLeaderboard('final-leaderboard', players);

  // TTS is manual only — no auto-announce

  const playAgainBtn = document.getElementById('play-again-btn');
  playAgainBtn.style.display = state.isHost ? 'block' : 'none';
  playAgainBtn.onclick = () => { cleanup(); state.sessionId = null; state.isHost = false; showHostSetup(); };
  document.getElementById('home-btn').onclick = () => showHome();
}

// ============================================================
//  INIT
// ============================================================

async function init() {
  while (!window.firebase || !window.firebase.app) await delay(50);
  let attempts = 0;
  while (attempts < 40) {
    try { firebase.app(); break; } catch { await delay(50); attempts++; }
  }
  try { db = firebase.firestore(); auth = firebase.auth(); }
  catch (e) { console.error('Firebase init failed:', e); return; }

  const code = new URLSearchParams(location.search).get('code');
  if (code) showJoin();
  else showHome();
}

// ============================================================
//  RECENT SESSIONS
// ============================================================

async function renderRecentSessions(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !db) return;
  try {
    const snap = await db.collection('sessions')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    if (snap.empty) { container.innerHTML = ''; return; }
    const rows = await Promise.all(snap.docs.map(async doc => {
      const d = doc.data();
      const pSnap = await doc.ref.collection('players').get();
      return { id: doc.id, topic: d.topic, status: d.status,
               qIdx: d.currentQuestionIndex, total: (d.questions || []).length,
               players: pSnap.size };
    }));
    const statusLabel = s => s === 'lobby' ? 'In Lobby' : s === 'question' ? 'Active' :
                              s === 'results' ? 'Results' : s === 'finished' ? 'Finished' : s;
    container.innerHTML = `
      <div class="recent-sessions-title">🕹️ Recent Games</div>
      ${rows.map(r => `
        <div class="recent-session-row">
          <span class="rs-topic">${r.topic || '—'}</span>
          <span class="rs-meta">
            <span class="rs-badge rs-badge-${r.status}">${statusLabel(r.status)}</span>
            Q${Math.max(r.qIdx + 1, 1)}/${r.total || '?'} &nbsp;·&nbsp; ${r.players} player${r.players !== 1 ? 's' : ''}
          </span>
        </div>`).join('')}
    `;
  } catch { container.innerHTML = ''; }
}

// ============================================================
//  WHAT'S NEW MODAL
// ============================================================

function showWhatsNew() {
  const modal = document.getElementById('whats-new-modal');
  const content = document.getElementById('whats-new-content');
  content.innerHTML = VERSIONS.map(v => `
    <div class="version-block">
      <div class="version-label">${v.label}</div>
      <div class="version-date">${v.date}</div>
      <ul class="version-changes">
        ${v.changes.map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  modal.style.display = '';
}

function closeWhatsNew(e) {
  if (e && e.target !== document.getElementById('whats-new-modal') && !e.target.classList.contains('modal-close')) return;
  document.getElementById('whats-new-modal').style.display = 'none';
}

window.App = { showHome, showHostSetup, showJoin, showWhatsNew, closeWhatsNew };
document.addEventListener('DOMContentLoaded', () => init().catch(console.error));
