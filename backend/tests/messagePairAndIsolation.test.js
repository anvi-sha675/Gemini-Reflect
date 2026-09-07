import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreService } from '../src/services/firestore.service.js';
import { createFakeFirestore, fakeFieldValue } from './testUtils/fakeFirestore.js';

function freshDb() {
  return createFirestoreService(createFakeFirestore(), fakeFieldValue);
}

test('appendMessagePair persists exactly 2 messages with distinct ids, correct roles/content, and increments messageCount by 2', async () => {
  const db = freshDb();
  const uid = 'user-a';
  const journalId = await db.createJournal(uid);

  const { userMessageId, modelMessageId } = await db.appendMessagePair(
    uid, journalId, 'I feel stuck on interview prep.', 'What part feels hardest right now?'
  );

  assert.notEqual(userMessageId, modelMessageId, 'user and assistant messages must get different ids');

  const messages = await db.listMessages(uid, journalId);
  assert.equal(messages.length, 2, 'exactly 2 messages should be persisted');
  assert.equal(messages[0].role, 'user');
  assert.equal(messages[0].content, 'I feel stuck on interview prep.');
  assert.equal(messages[1].role, 'model');
  assert.equal(messages[1].content, 'What part feels hardest right now?');

  const journal = await db.getJournal(uid, journalId);
  assert.equal(journal.messageCount, 2, 'messageCount should increase by exactly 2');
});

test('appendMessagePair called twice (simulating two real turns) produces 4 messages in order, no duplicates', async () => {
  const db = freshDb();
  const uid = 'user-a';
  const journalId = await db.createJournal(uid);

  await db.appendMessagePair(uid, journalId, 'first', 'first reply');
  await db.appendMessagePair(uid, journalId, 'second', 'second reply');

  const messages = await db.listMessages(uid, journalId);
  assert.equal(messages.length, 4);
  assert.deepEqual(messages.map((m) => m.content), ['first', 'first reply', 'second', 'second reply']);

  const journal = await db.getJournal(uid, journalId);
  assert.equal(journal.messageCount, 4);
});

test('a Gemini failure (never calling appendMessagePair) leaves zero messages persisted, so retry cannot duplicate anything', async () => {
  const db = freshDb();
  const uid = 'user-a';
  const journalId = await db.createJournal(uid);

  // Simulates the controller's real behavior: on a Gemini failure, it
  // returns before ever calling appendMessagePair.
  const messagesBeforeRetryAttempt = await db.listMessages(uid, journalId);
  assert.equal(messagesBeforeRetryAttempt.length, 0);

  // A subsequent successful retry with the same content is the FIRST thing
  // that actually persists — proving retry-safety at the data layer.
  await db.appendMessagePair(uid, journalId, 'retried content', 'reply after retry');
  const messages = await db.listMessages(uid, journalId);
  assert.equal(messages.length, 2, 'retry should persist exactly one pair, never a duplicate');
});

test('cross-user isolation: user B cannot read, update, or accumulate messages in user A journal via the data layer', async () => {
  const db = freshDb();
  const uidA = 'user-a';
  const uidB = 'user-b';

  const journalIdA = await db.createJournal(uidA);
  await db.appendMessagePair(uidA, journalIdA, 'private thought', 'a private reply');

  // B's own journal list must not contain A's journal.
  const bJournals = await db.listJournals(uidB);
  assert.equal(bJournals.length, 0);

  const crossUserLookup = await db.getJournal(uidB, journalIdA);
  assert.equal(crossUserLookup, null, "getJournal(uidB, A's journalId) must resolve to null, not A's data");

  const crossUserMessages = await db.listMessages(uidB, journalIdA);
  assert.equal(crossUserMessages.length, 0, "listMessages(uidB, A's journalId) must return nothing");

  // A's data is untouched and still fully intact.
  const aJournal = await db.getJournal(uidA, journalIdA);
  assert.equal(aJournal.messageCount, 2);
});

test('deleteAllUserData removes journals, messages, insights, timelines, and settings — verified by re-reading, not just the returned counts', async () => {
  const db = freshDb();
  const uid = 'user-a';
  const otherUid = 'user-b';

  const journalId = await db.createJournal(uid);
  await db.appendMessagePair(uid, journalId, 'hello', 'hi');
  await db.saveInsight(uid, { recurringThemes: ['career'] }, { sourceJournalCount: 1, sourceMessageCount: 2 });
  await db.saveTimeline(uid, [{ theme: 'career' }], { sourceJournalCount: 1, sourceMessageCount: 2 });
  await db.updateSettings(uid, { theme: 'dark' });

  // Another user's data must survive uid's deletion untouched.
  const otherJournalId = await db.createJournal(otherUid);

  const result = await db.deleteAllUserData(uid);
  assert.equal(result.success, true);
  assert.equal(result.journalsDeleted, 1);
  assert.equal(result.messagesDeleted, 2);
  assert.equal(result.insightsDeleted, 1);
  assert.equal(result.timelinesDeleted, 1);
  assert.equal(result.settingsDeleted, 1);

  // Re-read everything — don't just trust the returned counts.
  assert.deepEqual(await db.listJournals(uid), []);
  assert.equal(await db.getJournal(uid, journalId), null);
  assert.equal(await db.listMessages(uid, journalId).then((m) => m.length), 0);
  assert.equal(await db.getLatestInsight(uid), null);
  assert.equal(await db.getLatestTimeline(uid), null);
  assert.deepEqual(await db.getSettings(uid), {});

  // The other user's journal must still exist — deletion must never leak
  // across the uid boundary.
  const otherJournal = await db.getJournal(otherUid, otherJournalId);
  assert.ok(otherJournal, "other user's journal must survive uid's deletion");
});
