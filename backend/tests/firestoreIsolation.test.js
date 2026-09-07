import test from 'node:test';
import assert from 'node:assert/strict';

import * as db from '../src/services/firestore.service.js';

test('every exported Firestore accessor requires uid as its first argument', () => {
  const fnNames = [
    'createJournal', 'getJournal', 'listJournals', 'appendMessagePair',
    'listMessages', 'endJournalWithSummary', 'deleteJournal',
    'deleteAllUserData', 'saveInsight', 'getLatestInsight',
    'saveTimeline', 'getLatestTimeline', 'exportAllUserData',
  ];
  for (const name of fnNames) {
    assert.equal(typeof db[name], 'function', `${name} should be exported`);
    assert.ok(db[name].length >= 1, `${name} should require at least a uid argument`);
  }
});
