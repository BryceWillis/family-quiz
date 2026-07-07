#!/usr/bin/env node
/**
 * One-time migration: questionBank docs written by Cloud Functions used the
 * old ID format `${topic.toLowerCase().trim()}_${difficulty}`, which clients
 * never read (they use the sanitized `${slug}_d${difficulty}` format from
 * QuestionBank._firestoreKey in public/app.js). This script merges every
 * old-format doc into its new-format doc, deduping by normalized question
 * text, then deletes the old doc.
 *
 * Run ONLY after deploying the fixed Cloud Functions (WI-01), so no new
 * writes land on old IDs while this runs:
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> node scripts/migrate-bank-ids.js
 *
 * (or run under `gcloud auth application-default login` credentials)
 */
const admin = require('../functions/node_modules/firebase-admin');

if (admin.apps.length === 0) admin.initializeApp();

// Must match firestoreKey in functions/index.js and _firestoreKey in public/app.js.
function firestoreKey(topic, difficulty) {
  const t = topic.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').slice(0, 60);
  return `${t}_d${difficulty}`;
}

function normalizeText(s) {
  return (s || '').toLowerCase().trim();
}

async function migrate() {
  const db = admin.firestore();
  const snap = await db.collection('questionBank').get();
  console.log(`questionBank: ${snap.size} docs total`);

  let migrated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const { topic, difficulty } = doc.data();
    if (typeof topic !== 'string' || typeof difficulty !== 'number') {
      console.warn(`SKIP ${doc.id}: missing/invalid topic or difficulty fields`);
      skipped++;
      continue;
    }

    const newId = firestoreKey(topic, difficulty);
    if (doc.id === newId) {
      skipped++;
      continue; // already in the new format
    }

    const newRef = db.collection('questionBank').doc(newId);
    await db.runTransaction(async (tx) => {
      const [oldSnap, newSnap] = await Promise.all([tx.get(doc.ref), tx.get(newRef)]);
      if (!oldSnap.exists) return; // deleted concurrently

      const oldQuestions = oldSnap.data().questions || [];
      const newQuestions = newSnap.exists ? (newSnap.data().questions || []) : [];
      const seen = new Set(newQuestions.map((q) => normalizeText(q.question)));
      const toAdd = oldQuestions.filter((q) => {
        const key = normalizeText(q.question);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      tx.set(newRef, {
        topic,
        difficulty,
        questions: [...newQuestions, ...toAdd],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.delete(doc.ref);
      console.log(`MIGRATED ${doc.id} -> ${newId}: +${toAdd.length} of ${oldQuestions.length} questions (rest were duplicates)`);
    });
    migrated++;
  }

  console.log(`Done: ${migrated} migrated, ${skipped} skipped.`);
}

migrate().then(
  () => process.exit(0),
  (err) => { console.error('Migration failed:', err); process.exit(1); }
);
