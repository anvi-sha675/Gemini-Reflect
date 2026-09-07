import { firestore as defaultFirestore } from '../config/firebaseAdmin.js';
import admin from '../config/firebaseAdmin.js';

const defaultFieldValue = admin.firestore.FieldValue;

export function createFirestoreService(db = defaultFirestore, FieldValue = defaultFieldValue) {
  function journalsRef(uid) {
    return db.collection('users').doc(uid).collection('journals');
  }

  function messagesRef(uid, journalId) {
    return journalsRef(uid).doc(journalId).collection('messages');
  }

  function insightsRef(uid) {
    return db.collection('users').doc(uid).collection('insights');
  }

  function timelinesRef(uid) {
    return db.collection('users').doc(uid).collection('timelines');
  }

  function settingsRef(uid) {
    return db.collection('users').doc(uid).collection('settings');
  }

  function userDocRef(uid) {
    return db.collection('users').doc(uid);
  }

  async function deleteCollectionDocs(collectionRef) {
    const snap = await collectionRef.get();
    if (snap.empty) return 0;

    const docs = snap.docs;
    const BATCH_SIZE = 450;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return docs.length;
  }

  async function createJournal(uid) {
    const doc = await journalsRef(uid).add({
      title: 'Untitled reflection',
      status: 'active',
      messageCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return doc.id;
  }

  async function getJournal(uid, journalId) {
    const snap = await journalsRef(uid).doc(journalId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async function listJournals(uid, { limit = 50 } = {}) {
    const snap = await journalsRef(uid).orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const EXPORT_PAGE_SIZE = 200;
  async function listAllJournals(uid) {
    const results = [];
    let cursor = null;

    for (; ;) {
      let query = journalsRef(uid).orderBy('createdAt', 'desc').limit(EXPORT_PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);

      const snap = await query.get();
      if (snap.empty) break;

      results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (snap.docs.length < EXPORT_PAGE_SIZE) break; // last page
      cursor = snap.docs[snap.docs.length - 1];
    }

    return results;
  }

  async function appendMessagePair(uid, journalId, userContent, modelContent) {
    const batch = db.batch();
    const userDoc = messagesRef(uid, journalId).doc();
    const modelDoc = messagesRef(uid, journalId).doc();

    batch.set(userDoc, { role: 'user', content: userContent, timestamp: FieldValue.serverTimestamp() });
    batch.set(modelDoc, { role: 'model', content: modelContent, timestamp: FieldValue.serverTimestamp() });
    batch.update(journalsRef(uid).doc(journalId), {
      messageCount: FieldValue.increment(2),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return { userMessageId: userDoc.id, modelMessageId: modelDoc.id };
  }

  async function listMessages(uid, journalId) {
    const snap = await messagesRef(uid, journalId).orderBy('timestamp', 'asc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function endJournalWithSummary(uid, journalId, summary) {
    await journalsRef(uid).doc(journalId).update({
      status: 'ended',
      title: summary.title,
      summary: summary.overview,
      themes: summary.themes,
      mood: summary.mood,
      takeaways: summary.takeaways,
      actionItems: summary.actionItems,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  async function deleteJournal(uid, journalId) {
    await deleteCollectionDocs(messagesRef(uid, journalId));
    await journalsRef(uid).doc(journalId).delete();
  }

  async function deleteAllUserData(uid) {
    const result = {
      journalsDeleted: 0,
      messagesDeleted: 0,
      insightsDeleted: 0,
      timelinesDeleted: 0,
      settingsDeleted: 0,
      errors: [],
    };

    try {
      const journals = await journalsRef(uid).get();
      for (const j of journals.docs) {
        try {
          const msgCount = await deleteCollectionDocs(messagesRef(uid, j.id));
          await journalsRef(uid).doc(j.id).delete();
          result.journalsDeleted += 1;
          result.messagesDeleted += msgCount;
        } catch (err) {
          result.errors.push({ resource: 'journal', id: j.id, message: err.message });
        }
      }
    } catch (err) {
      result.errors.push({ resource: 'journals', message: err.message });
    }

    try {
      result.insightsDeleted = await deleteCollectionDocs(insightsRef(uid));
    } catch (err) {
      result.errors.push({ resource: 'insights', message: err.message });
    }

    try {
      result.timelinesDeleted = await deleteCollectionDocs(timelinesRef(uid));
    } catch (err) {
      result.errors.push({ resource: 'timelines', message: err.message });
    }

    try {
      result.settingsDeleted = await deleteCollectionDocs(settingsRef(uid));
    } catch (err) {
      result.errors.push({ resource: 'settings', message: err.message });
    }

    try {
      await userDocRef(uid).delete();
    } catch (err) {
      result.errors.push({ resource: 'profile', message: err.message });
    }

    result.success = result.errors.length === 0;
    return result;
  }

  async function saveInsight(uid, insight, meta = {}) {
    const doc = await insightsRef(uid).add({
      ...insight,
      ...meta,
      createdAt: FieldValue.serverTimestamp(),
    });
    return doc.id;
  }

  async function getLatestInsight(uid) {
    const snap = await insightsRef(uid).orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }

  async function saveTimeline(uid, entries, meta = {}) {
    const doc = await timelinesRef(uid).add({
      entries,
      ...meta,
      createdAt: FieldValue.serverTimestamp(),
    });
    return doc.id;
  }

  async function getLatestTimeline(uid) {
    const snap = await timelinesRef(uid).orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }

  async function getSettings(uid) {
    const snap = await settingsRef(uid).doc('preferences').get();
    return snap.exists ? snap.data() : {};
  }

  async function updateSettings(uid, updates) {
    await settingsRef(uid).doc('preferences').set(
      { ...updates, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async function exportAllUserData(uid) {
    const journals = await listAllJournals(uid);
    const withMessages = await Promise.all(
      journals.map(async (j) => ({ ...j, messages: await listMessages(uid, j.id) }))
    );
    const insightsSnap = await insightsRef(uid).orderBy('createdAt', 'desc').get();
    const insights = insightsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const timelinesSnap = await timelinesRef(uid).orderBy('createdAt', 'desc').limit(1).get();
    const timelines = timelinesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const settings = await getSettings(uid);

    return {
      uid,
      exportedAt: new Date().toISOString(),
      journals: withMessages,
      insights,
      growthTimeline: timelines[0] || null,
      settings,
    };
  }

  return {
    createJournal, getJournal, listJournals, appendMessagePair, listMessages,
    endJournalWithSummary, deleteJournal, deleteAllUserData, saveInsight,
    getLatestInsight, saveTimeline, getLatestTimeline, getSettings,
    updateSettings, exportAllUserData,
  };
}

const bound = createFirestoreService();

export const {
  createJournal, getJournal, listJournals, appendMessagePair, listMessages,
  endJournalWithSummary, deleteJournal, deleteAllUserData, saveInsight,
  getLatestInsight, saveTimeline, getLatestTimeline, getSettings,
  updateSettings, exportAllUserData,
} = bound;
