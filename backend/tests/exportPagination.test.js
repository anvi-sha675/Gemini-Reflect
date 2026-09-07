import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreService } from '../src/services/firestore.service.js';
import { createFakeFirestore, fakeFieldValue } from './testUtils/fakeFirestore.js';

test('exportAllUserData returns every journal, exercising real multi-page cursor pagination', async () => {
  const db = createFirestoreService(createFakeFirestore(), fakeFieldValue);
  const uid = 'user-with-many-journals';

  const JOURNAL_COUNT = 205; // > the 200-per-page cursor size, forcing 2 pages
  const createdIds = [];
  for (let i = 0; i < JOURNAL_COUNT; i++) {
    const id = await db.createJournal(uid);
    createdIds.push(id);
  }

  const exported = await db.exportAllUserData(uid);

  assert.equal(exported.journals.length, JOURNAL_COUNT, 'export must return every journal, not just the first page');

  const exportedIds = new Set(exported.journals.map((j) => j.id));
  assert.equal(exportedIds.size, JOURNAL_COUNT, 'no duplicate journals across pages');
  for (const id of createdIds) {
    assert.ok(exportedIds.has(id), `journal ${id} should be present in the export`);
  }
});

test('exportAllUserData still isolates by uid when another user also has many journals', async () => {
  const db = createFirestoreService(createFakeFirestore(), fakeFieldValue);
  const uidA = 'user-a-many';
  const uidB = 'user-b-many';

  for (let i = 0; i < 3; i++) await db.createJournal(uidA);
  for (let i = 0; i < 210; i++) await db.createJournal(uidB);

  const exportedA = await db.exportAllUserData(uidA);
  assert.equal(exportedA.journals.length, 3, "user A's export must not include user B's journals");
});
