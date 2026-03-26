// ============================================================
//  FAMILY QUIZ — app.js
// ============================================================

// ----- UTILS -----
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

// ----- GENERATING SCREEN STATUS MESSAGES -----
//  Add new messages here in future releases to keep the loading screen fresh.
const GENERATION_STATUSES = [
  'Reticulating splines…',
  'Consulting the oracle…',
  'Waking up the quiz elves…',
  'Arguing about which answer is correct…',
  'Bribing the AI with compliments…',
  'Cross-referencing the encyclopedia…',
  'Calibrating the difficulty dial…',
  'Polishing the trophy…',
  'Making sure none of the answers are "all of the above"…',
  'Checking the answers aren\'t all C…',
  'Asking Claude very nicely…',
  'Shuffling the question deck…',
  'Verifying nobody cheated…',
  'Counting to ten and back again…',
  'Separating the trick questions from the merely evil ones…',
];

// ----- BANNED WORDS -----
//  Update this list in future releases. Word-boundary matched (standalone words only).
const BannedWords = {
  list: ['donald','trump','elon','musk','fuck','shit','ass','nigger','negro','bitch','cunt'],

  _re() {
    return new RegExp(`\\b(${this.list.join('|')})\\b`, 'i');
  },

  /** True if text contains any banned word as a standalone word. */
  contains(text) {
    return text ? this._re().test(text) : false;
  },

  /** True if any text field of a question object contains a banned word. */
  containsInQuestion(q) {
    const fields = [q.question, q.explanation, ...(q.options || [])];
    return fields.some(f => f && this.contains(f));
  },
};

// ----- VERSION HISTORY -----
const VERSIONS = [
  {
    version: '1.16',
    label: 'v1.16: Host Controls & Game History',
    date: 'March 2026',
    changes: [
      'Hosts can now end any game early using the 🛑 End Game button on the question or results screen. All players are immediately taken to the final scores.',
      'Recent Games now shows a status badge for each game — Active, Finished, or Ended Early.',
    ],
  },
  {
    version: '1.15',
    label: 'v1.15: Generating Screen & Content Filters',
    date: 'March 2026',
    changes: [
      'The question-generating screen now shows a playful status message while the AI is thinking.',
      'There is now a list of banned words — topics and names that contain them are automatically handled to keep things family friendly.',
    ],
  },
  {
    version: '1.14',
    label: 'v1.14: Question Feedback',
    date: 'March 2026',
    changes: [
      'Tap 👍 or 👎 on any question, on either the question or results screen.',
      'Your vote persists between both screens and you can undo it at any time.',
      'Votes are counted per question across all games. Questions with more thumbs down than up gradually drop out of rotation.',
    ],
  },
  {
    version: '1.13',
    label: 'v1.13: Showdown Live',
    date: 'March 2026',
    changes: [
      'The app is now called Showdown Live!',
      '👎 Flag a bad question right from the question screen, not just the results screen. Useful when two answers look the same and you\'re not sure which is right.',
      'Questions are now stored in a shared server bank. Every game builds it up, so returning to the same topic means fewer AI calls and more variety over time.',
    ],
  },
  {
    version: '1.12',
    label: 'v1.12: Polish and Question Feedback',
    date: 'March 2026',
    changes: [
      '👎 Flag a question you don\'t like on the results screen. It will appear less often in future games.',
      'Removed em dashes throughout the app, they were everywhere and nobody asked for them',
    ],
  },
  {
    version: '1.11',
    label: 'v1.11: Results Screen Upgrades',
    date: 'March 2026',
    changes: [
      'Results screen now shows every player: green for correct, red for wrong',
      'Your own chip is outlined so you can find yourself instantly',
      'Celebratory banner when the whole group gets a question right',
      'Commiseration banner when nobody gets it, because sometimes the questions are just hard',
    ],
  },
  {
    version: '1.10',
    label: 'v1.10: Polish & Accessibility',
    date: 'March 2026',
    changes: [
      '🔊 Read Aloud now highlights the question and each answer option as it\'s being read',
      'Share button now copies a friendly message with the quiz topic, great for iMessage and WhatsApp',
      '20-question option added to host setup',
      'Save to iPhone home screen now shows the quiz icon and title',
    ],
  },
  {
    version: '1.7',
    label: 'v1.7: More Ways to Play',
    date: 'March 2026',
    changes: [
      '"No Timer" option: take as long as you need, great for younger kids',
      'Speed scoring mode: answer faster to earn more points (up to 1000!)',
      'Fixed dice button sizing in the join form',
      'Fixed What\'s New modal header text colour',
    ],
  },
  {
    version: '1.6',
    label: 'v1.6: Your Name, Your Way',
    date: 'March 2026',
    changes: [
      'Players now use their entered name throughout the game. No more hidden silly names.',
      'Added 🎲 button on the join screen to fill in a random silly name if you want one',
      'Wrong answer card now shows in red so you know immediately you got it wrong',
      'Correct answer card stays green when you got it right',
    ],
  },
  {
    version: '1.5',
    label: 'v1.5: Analytics',
    date: 'March 2026',
    changes: [
      'Added Google Analytics via Firebase Analytics',
      'Removed auto-playing text-to-speech, now manual only',
    ],
  },
  {
    version: '1.4',
    label: 'v1.4: Navigation Fix',
    date: 'March 2026',
    changes: [
      'Fixed host getting stuck on scoreboard after clicking Next Question',
      'Both host and players now navigate via real-time Firestore watchers',
    ],
  },
  {
    version: '1.3',
    label: 'v1.3: Read Aloud',
    date: 'March 2026',
    changes: [
      'Added 🔊 Read Aloud button on question screen',
      'Tap again to stop mid-read',
      'Great for younger players who are still learning to read',
    ],
  },
  {
    version: '1.2',
    label: 'v1.2: Question Bank',
    date: 'March 2026',
    changes: [
      'Questions are now cached locally so the AI is called less often',
      'Unseen questions are always shown first',
      'Oldest questions get recycled when the bank runs low',
    ],
  },
  {
    version: '1.1',
    label: 'v1.1: Difficulty Levels',
    date: 'March 2026',
    changes: [
      'Added difficulty slider: Easy, Medium, Difficult, Impossible',
      'Claude tailors question complexity to the chosen level',
      'API key is now saved so you only type it once',
    ],
  },
  {
    version: '1.0',
    label: 'v1.0: Initial Release',
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

// ----- STATE -----
const state = {
  userId:           null,
  sillyName:        null,
  sessionId:        null,
  isHost:           false,
  unsubscribers:    [],
  timerInterval:    null,
  endingQuestion:   false,
  questionFeedback: {},  // key: lowercase question text → 'up' | 'down' | null
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

function closeBannedModal() {
  document.getElementById('banned-modal').style.display = 'none';
}
function showBannedModal() {
  document.getElementById('banned-modal').style.display = 'flex';
}

const GeneratingAnimation = {
  _interval: null,
  _msgs:     [],
  _idx:      0,

  start() {
    const el = document.getElementById('generating-status');
    if (!el) return;
    // Shuffle for variety each run
    this._msgs = [...GENERATION_STATUSES].sort(() => Math.random() - 0.5);
    this._idx  = 0;
    el.textContent = this._msgs[0];
    el.style.opacity = '1';

    this._interval = setInterval(() => {
      el.style.opacity = '0';
      setTimeout(() => {
        if (!this._interval) return;
        this._idx = (this._idx + 1) % this._msgs.length;
        el.textContent = this._msgs[this._idx];
        el.style.opacity = '1';
      }, 350);
    }, 2800);
  },

  stop() {
    clearInterval(this._interval);
    this._interval = null;
    const el = document.getElementById('generating-status');
    if (el) el.style.opacity = '0';
  },
};

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

  /** Firestore document ID — safe alphanumeric key for the topic+difficulty. */
  _firestoreKey(topic, difficulty) {
    const t = topic.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').slice(0, 60);
    return `${t}_d${difficulty}`;
  },

  /** Pull questions for this topic+difficulty from Firestore into the local bank. */
  async fetchFromFirestore(topic, difficulty) {
    if (!db) return;
    try {
      const snap = await db.collection('questionBank').doc(this._firestoreKey(topic, difficulty)).get();
      if (!snap.exists) return;
      const serverQuestions = snap.data().questions || [];
      if (serverQuestions.length > 0) this.add(topic, difficulty, serverQuestions);
    } catch (e) { console.warn('QuestionBank fetch failed:', e); }
  },

  /** Update upvotes/downvotes/score for a question in localStorage.
   *  oldVote / newVote: 'up' | 'down' | null */
  updateLocalVote(topic, difficulty, questionText, oldVote, newVote) {
    const bank = this.load();
    const key  = this._bankKey(topic, difficulty);
    const pool = bank[key] || [];
    const qKey = questionText.toLowerCase().trim();
    const q    = pool.find(q => q.question.toLowerCase().trim() === qKey);
    if (!q) return;
    if (q.upvotes   == null) q.upvotes   = 0;
    if (q.downvotes == null) q.downvotes = 0;
    if (oldVote === 'up')   q.upvotes   = Math.max(0, q.upvotes   - 1);
    if (oldVote === 'down') q.downvotes = Math.max(0, q.downvotes - 1);
    if (newVote === 'up')   q.upvotes++;
    if (newVote === 'down') q.downvotes++;
    q.score  = q.upvotes - q.downvotes;
    bank[key] = pool;
    this.save(bank);
  },

  /** Persist a vote delta via the submitVote Cloud Function (server-side write). */
  async syncVoteToFirestore(topic, difficulty, questionText, oldVote, newVote) {
    try {
      const fn = firebase.app().functions('us-east1').httpsCallable('submitVote');
      await fn({ topic, difficulty, questionText, oldVote, newVote });
    } catch (e) { console.warn('Vote sync failed:', e); }
  },

  /** Return up to `count` questions for topic+difficulty.
   *  Priority order: unseen → seen → low-score (score < 0 last). */
  get(topic, difficulty, count) {
    const bank    = this.load();
    const key     = this._bankKey(topic, difficulty);
    const pool    = bank[key] || [];
    if (pool.length === 0) return [];

    const isBad = q => (q.score || 0) < 0;

    const unseen  = pool.filter(q => !q.seenDate && !isBad(q));
    const seen    = pool.filter(q =>  q.seenDate  && !isBad(q))
      .sort((a, b) => new Date(a.seenDate) - new Date(b.seenDate));
    const bad     = pool.filter(isBad);

    // Shuffle unseen for variety
    for (let i = unseen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
    }
    // Light shuffle of seen (swap neighbours ~30% of the time)
    for (let i = 0; i < seen.length - 1; i++) {
      if (Math.random() < 0.3) [seen[i], seen[i + 1]] = [seen[i + 1], seen[i]];
    }

    return [...unseen, ...seen, ...bad].slice(0, count);
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
//  QUESTION FEEDBACK  (session-scoped, syncs to Firestore)
// ============================================================
//  state.questionFeedback[key] = 'up' | 'down' | null
//  Persists within a game session (question screen ↔ results screen).

/** Submit or toggle a feedback vote for the current question.
 *  Handles local bank update + Firestore sync. */
async function submitQuestionFeedback(topic, difficulty, q, clickedVote) {
  const key    = q.question.toLowerCase().trim();
  const oldVote = state.questionFeedback[key] || null;
  const newVote = oldVote === clickedVote ? null : clickedVote;  // tap again = undo

  state.questionFeedback[key] = newVote;
  QuestionBank.updateLocalVote(topic, difficulty, q.question, oldVote, newVote);
  QuestionBank.syncVoteToFirestore(topic, difficulty, q.question, oldVote, newVote);
  updateFeedbackUI(key);
}

/** Sync the visual state of all feedback buttons for this question. */
function updateFeedbackUI(qKey) {
  const vote = state.questionFeedback[qKey] || null;
  const pairs = [
    ['feedback-up-q', 'feedback-down-q'],
    ['feedback-up',   'feedback-down'],
  ];
  pairs.forEach(([upId, downId]) => {
    const upBtn   = document.getElementById(upId);
    const downBtn = document.getElementById(downId);
    if (upBtn) {
      upBtn.classList.toggle('voted-up',   vote === 'up');
      upBtn.classList.toggle('voted-down', false);
    }
    if (downBtn) {
      downBtn.classList.toggle('voted-down', vote === 'down');
      downBtn.classList.toggle('voted-up',   false);
    }
  });
}

/** Wire the 👍/👎 buttons for a given screen suffix ('q' for question, '' for results). */
function wireFeedbackButtons(suffix, topic, difficulty, q) {
  const sep    = suffix ? '-' + suffix : '';
  const upBtn  = document.getElementById('feedback-up'   + sep);
  const downBtn= document.getElementById('feedback-down' + sep);
  const qKey   = q.question.toLowerCase().trim();

  // Set initial visual state
  const vote = state.questionFeedback[qKey] || null;
  if (upBtn) {
    upBtn.classList.toggle('voted-up',   vote === 'up');
    upBtn.classList.toggle('voted-down', false);
    upBtn.onclick = () => submitQuestionFeedback(topic, difficulty, q, 'up');
  }
  if (downBtn) {
    downBtn.classList.toggle('voted-down', vote === 'down');
    downBtn.classList.toggle('voted-up',   false);
    downBtn.onclick = () => submitQuestionFeedback(topic, difficulty, q, 'down');
  }
}

// ============================================================
//  TEXT-TO-SPEECH
// ============================================================

const TTS = {
  _active: false,

  stop() {
    this._active = false;
    window.speechSynthesis.cancel();
    this._updateBtn();
    document.querySelectorAll('.tts-reading').forEach(el => el.classList.remove('tts-reading'));
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

    // Highlight question card while reading the question text
    const qCard = document.querySelector('.question-card');
    if (qCard) qCard.classList.add('tts-reading');
    await this.speak(question);
    if (qCard) qCard.classList.remove('tts-reading');

    await delay(400);
    const letters  = ['A', 'B', 'C', 'D'];
    const optBtns  = document.querySelectorAll('.option-btn');
    for (let i = 0; i < options.length; i++) {
      if (!this._active) break;
      // Highlight each option button as it is being read aloud
      if (optBtns[i]) optBtns[i].classList.add('tts-reading');
      await this.speak(`${letters[i]}: ${options[i]}`);
      if (optBtns[i]) optBtns[i].classList.remove('tts-reading');
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
//  CLAUDE API — question generation (via Cloud Function)
// ============================================================

async function generateQuestions(topic, count, difficulty) {
  const fn     = firebase.app().functions('us-east1').httpsCallable('generateQuestions');
  const result = await fn({ topic, count, difficulty });
  return result.data.questions;
}

// ============================================================
//  RENDER HELPERS
// ============================================================

function renderPlayerChips(containerId, players) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = players.map(p =>
    `<div class="player-chip ${p.id === state.userId ? 'me' : ''}">
      ${escapeHtml(p.displayName)}${p.id === state.userId ? ' <em>(you)</em>' : ''}
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
      <span class="lb-name">${escapeHtml(p.displayName)}${p.id === state.userId ? ' ✨' : ''}</span>
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

  // Difficulty slider live label
  const slider  = document.getElementById('difficulty');
  const display = document.getElementById('diff-display');
  const updateDiffLabel = () => {
    display.textContent = DIFFICULTY_LABELS[parseInt(slider.value)];
  };
  slider.oninput = updateDiffLabel;
  updateDiffLabel();

  // Speed scoring requires a timer — disable it when "No Timer" is selected
  const timeSelect    = document.getElementById('time-per-q');
  const scoringSelect = document.getElementById('scoring-mode');
  const scoringHint   = document.getElementById('scoring-hint');
  const updateScoringAvailability = () => {
    const noTimer = parseInt(timeSelect.value) === 0;
    scoringSelect.disabled    = noTimer;
    scoringHint.style.display = noTimer ? 'block' : 'none';
    if (noTimer) scoringSelect.value = 'flat';
  };
  timeSelect.onchange = updateScoringAvailability;
  updateScoringAvailability();

  document.getElementById('host-setup-form').onsubmit = async e => {
    e.preventDefault();
    let hostName      = document.getElementById('host-name').value.trim();
    const topic       = document.getElementById('topic').value.trim();
    const difficulty  = parseInt(document.getElementById('difficulty').value);
    const numQ        = parseInt(document.getElementById('num-questions').value);
    const timeQ       = parseInt(document.getElementById('time-per-q').value);
    const scoringMode = document.getElementById('scoring-mode').value;
    if (!hostName || !topic) return;
    // Silently replace banned names with a random name
    if (BannedWords.contains(hostName)) hostName = generateSillyName();
    // Reject banned topics
    if (BannedWords.contains(topic)) {
      document.getElementById('topic').value = '';
      showBannedModal();
      return;
    }
    await startCreateGame(hostName, topic, difficulty, numQ, timeQ, scoringMode);
  };
}

async function startCreateGame(hostName, topic, difficulty, numQ, timeQ, scoringMode) {
  state.questionFeedback = {};  // reset feedback state for new game
  showScreen('screen-generating');
  document.getElementById('generating-topic').textContent =
    `"${topic}" · ${DIFFICULTY_LABELS[difficulty]}`;
  GeneratingAnimation.start();

  try {
    await ensureAuth();

    // 1. Check local bank first (fast, no network)
    let questions = QuestionBank.get(topic, difficulty, numQ);

    // 2. If local bank is short, pull from Firestore server bank
    if (questions.length < numQ) {
      await QuestionBank.fetchFromFirestore(topic, difficulty);
      questions = QuestionBank.get(topic, difficulty, numQ);
    }

    // 3. If still short, generate with AI (extra questions go into the bank for later)
    if (questions.length < numQ) {
      const needed    = numQ - questions.length;
      const generated = await generateQuestions(topic, needed + 5, difficulty);
      // Filter out any questions containing banned words before storing
      const clean = generated.filter(q => !BannedWords.containsInQuestion(q));
      QuestionBank.add(topic, difficulty, clean);
      questions = QuestionBank.get(topic, difficulty, numQ);
    }

    // 4. Mark selected questions as seen today
    QuestionBank.markSeen(topic, difficulty, questions.map(q => q.question));

    // Find a unique 4-char game code
    let code;
    for (let i = 0; i < 20; i++) {
      code = generateGameCode();
      const existing = await db.collection('sessions').doc(code).get();
      if (!existing.exists) break;
    }

    state.displayName = hostName;
    state.sessionId   = code;
    state.isHost      = true;
    state.topic       = topic;

    await db.collection('sessions').doc(code).set({
      hostId:               state.userId,
      hostName,
      status:               'lobby',
      currentQuestionIndex: -1,
      topic,
      difficulty,
      questions,
      timePerQuestion:      timeQ,
      scoringMode:          scoringMode || 'flat',
      questionStartTime:    null,
      createdAt:            firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('sessions').doc(code)
      .collection('players').doc(state.userId).set({
        displayName:             hostName,
        score:                   0,
        answeredCurrentQuestion: false,
        currentAnswer:           -1,
        lastAnswerCorrect:       null,
        joinedAt:                firebase.firestore.FieldValue.serverTimestamp(),
      });

    GeneratingAnimation.stop();
    showLobbyHost();
  } catch (err) {
    console.error(err);
    GeneratingAnimation.stop();
    showScreen('screen-host-setup');
    showError(`Could not create game: ${err.message}`);
  }
}

// ----- END GAME (HOST) -----
async function cancelGame() {
  if (!state.isHost || !state.sessionId) return;
  try {
    await db.collection('sessions').doc(state.sessionId).update({
      status:  'ended-manual',
      endedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // Navigation handled by onSnapshot watchers (same path as 'finished')
  } catch (e) { console.warn('cancelGame failed:', e); }
}

// ----- LOBBY (HOST) -----
function showLobbyHost() {
  cleanup();
  showScreen('screen-lobby-host');

  document.getElementById('game-code-display').textContent = state.sessionId;

  const shareLink = `${location.origin}${location.pathname}?code=${state.sessionId}`;
  document.getElementById('share-link').value = shareLink;

  document.getElementById('copy-link-btn').onclick = () => {
    const clipText = state.topic
      ? `Join our Family Quiz about "${state.topic}"! Code: ${state.sessionId} or tap: ${shareLink}`
      : shareLink;
    navigator.clipboard.writeText(clipText).then(() => {
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

  document.getElementById('silly-name-btn').onclick = () => {
    document.getElementById('player-name').value = generateSillyName();
  };

  document.getElementById('join-form').onsubmit = async e => {
    e.preventDefault();
    let name   = document.getElementById('player-name').value.trim();
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (!name || !code) return;
    // Silently replace banned names with a random name
    if (BannedWords.contains(name)) name = generateSillyName();
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

    state.displayName    = playerName;
    state.sessionId      = code;
    state.isHost         = false;
    state.questionFeedback = {};

    await sessionRef.collection('players').doc(state.userId).set({
      displayName: playerName,
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
  document.getElementById('my-silly-name').textContent    = state.displayName;
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
    btn.innerHTML = `<span class="opt-badge">${letters[i]}</span><span class="opt-text">${escapeHtml(opt)}</span>`;
    btn.onclick = async () => {
      if (hasAnswered) return;
      hasAnswered = true;
      document.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; b.classList.add('dimmed'); });
      btn.classList.remove('dimmed');
      btn.classList.add('chosen');
      document.getElementById('waiting-indicator').style.display = 'flex';
      await db.collection('sessions').doc(state.sessionId)
        .collection('players').doc(state.userId)
        .update({
          currentAnswer: i,
          answeredCurrentQuestion: true,
          answeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    };
    optionsEl.appendChild(btn);
  });

  // TTS — manual only, button toggles read/stop
  document.getElementById('tts-repeat-btn').onclick = () => TTS.readQuestion(q.question, q.options);

  // Feedback buttons (question screen)
  wireFeedbackButtons('q', sessionData.topic, sessionData.difficulty, q);

  // Timer
  startTimer(timePerQuestion, questionStartTime, qIdx);

  // Host-only controls
  const hostPanel = document.getElementById('host-q-panel');
  if (state.isHost) {
    hostPanel.style.display = 'flex';
    document.getElementById('skip-btn').onclick = () => endQuestion(qIdx);
    document.getElementById('end-game-btn-q').onclick = cancelGame;

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
    } else if (data.status === 'finished' || data.status === 'ended-manual') {
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

  // No-timer mode: show infinity, don't auto-advance
  if (duration === 0) {
    fill.style.width = '100%';
    fill.className   = 'timer-fill green';
    secsEl.textContent = '∞';
    return;
  }

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

  const correctIdx    = session.questions[qIdx].correct;
  const scoringMode   = session.scoringMode || 'flat';
  const timePerQ      = session.timePerQuestion;
  const startTime     = session.questionStartTime;
  const startMs       = startTime
    ? (typeof startTime.toMillis === 'function'
        ? startTime.toMillis()
        : startTime.seconds * 1000 + Math.floor((startTime.nanoseconds || 0) / 1e6))
    : 0;

  const pSnap = await sessionRef.collection('players').get();
  const batch = db.batch();
  pSnap.docs.forEach(doc => {
    const p         = doc.data();
    const isCorrect = p.currentAnswer === correctIdx;
    let points = 0;
    if (isCorrect) {
      if (scoringMode === 'speed' && timePerQ > 0 && p.answeredAt) {
        const answeredMs = typeof p.answeredAt.toMillis === 'function'
          ? p.answeredAt.toMillis()
          : p.answeredAt.seconds * 1000 + Math.floor((p.answeredAt.nanoseconds || 0) / 1e6);
        const elapsed = Math.max(0, (answeredMs - startMs) / 1000);
        // 1000 pts for instant answer → 100 pts for answering right at the buzzer
        points = Math.round(100 + 900 * Math.max(0, 1 - elapsed / timePerQ));
      } else {
        points = 100;
      }
    }
    batch.update(doc.ref, {
      lastAnswerCorrect: isCorrect,
      score: firebase.firestore.FieldValue.increment(points),
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

  // Hide card until we know if the player got it right, to avoid a green→red flash
  const card  = document.querySelector('.correct-answer-card');
  const label = card.querySelector('.correct-label');
  card.classList.add('loading');

  document.getElementById('correct-answer').innerHTML =
    `<span class="answer-badge">${correctLetter}</span>${escapeHtml(correctText)}`;
  document.getElementById('results-explanation').textContent = q.explanation || '';

  const pSnap   = await db.collection('sessions').doc(state.sessionId).collection('players').get();
  const players = pSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.score - a.score);

  const myPlayer    = players.find(p => p.id === state.userId);
  const iGotItRight = myPlayer && myPlayer.currentAnswer === q.correct;
  card.classList.remove('loading');
  if (iGotItRight) {
    card.classList.remove('wrong');
    label.textContent = '✅ Correct Answer';
  } else {
    card.classList.add('wrong');
    label.textContent = '❌ You got this wrong. Correct answer was:';
  }

  // Color-coded player chips: green = correct, red = wrong, outline = you
  document.getElementById('who-got-it').innerHTML = players.map(p => {
    const isCorrect = p.currentAnswer === q.correct;
    const isMe      = p.id === state.userId;
    const classes   = ['got-it-chip', isCorrect ? 'correct' : 'wrong', isMe ? 'me' : ''].join(' ').trim();
    const icon      = isCorrect ? '✅' : '❌';
    const youLabel  = isMe ? ' <em>(you)</em>' : '';
    return `<div class="${classes}">${icon} ${escapeHtml(p.displayName)}${youLabel}</div>`;
  }).join('');

  // Reaction banner: all correct or all wrong
  const correctCount = players.filter(p => p.currentAnswer === q.correct).length;
  const bannerEl = document.getElementById('reaction-banner');
  if (players.length > 1 && correctCount === players.length) {
    bannerEl.innerHTML = '<div class="reaction-banner all-correct">🎉🎉🎉 Everyone got it right!</div>';
  } else if (correctCount === 0) {
    bannerEl.innerHTML = '<div class="reaction-banner all-wrong">😬 Nobody got this one, even the AI is impressed!</div>';
  } else {
    bannerEl.innerHTML = '';
  }

  // Feedback buttons (results screen)
  wireFeedbackButtons('', sessionData.topic, sessionData.difficulty, q);

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

    document.getElementById('end-game-btn-r').onclick = cancelGame;
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
    else if (data.status === 'finished' || data.status === 'ended-manual') { cleanup(); showFinal(); }
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

  document.getElementById('winner-name').textContent  = winner?.displayName ?? '???';
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
    const statusLabel = s =>
      s === 'lobby'        ? 'In Lobby'       :
      s === 'question'     ? 'Active'          :
      s === 'results'      ? 'Results'         :
      s === 'finished'     ? 'Finished'        :
      s === 'ended-manual' ? 'Ended - Manual'  :
      s === 'ended-auto'   ? 'Ended - Auto'    : s;
    container.innerHTML = `
      <div class="recent-sessions-title">🕹️ Recent Games</div>
      ${rows.map(r => `
        <div class="recent-session-row">
          <span class="rs-topic">${escapeHtml(r.topic || '?')}</span>
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
  modal.style.display = 'flex';
}

function closeWhatsNew(e) {
  if (e && e.target !== document.getElementById('whats-new-modal') && !e.target.classList.contains('modal-close')) return;
  document.getElementById('whats-new-modal').style.display = 'none';
}

window.App = { showHome, showHostSetup, showJoin, showWhatsNew, closeWhatsNew };
window.closeBannedModal = closeBannedModal;
document.addEventListener('DOMContentLoaded', () => init().catch(console.error));
