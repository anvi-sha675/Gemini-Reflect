import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as db from '../src/services/firestore.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('deleteAllUserData is exported and touches journals, insights, timelines, and settings, with explicit success/error tracking', () => {
  assert.equal(typeof db.deleteAllUserData, 'function', 'deleteAllUserData should be exported');

  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'services', 'firestore.service.js'),
    'utf8'
  );
  const fnMatch = source.match(/async function deleteAllUserData[\s\S]*?\n {2}}\n/);
  assert.ok(fnMatch, 'deleteAllUserData should be defined in the source');
  const body = fnMatch[0];

  for (const resource of ['journalsRef', 'insightsRef', 'timelinesRef', 'settingsRef']) {
    assert.match(body, new RegExp(resource), `deleteAllUserData should touch ${resource}`);
  }
  assert.match(body, /result\.success/, 'deleteAllUserData should report success/failure explicitly, not assume it');
  assert.match(body, /errors/, 'deleteAllUserData should track per-resource errors instead of failing silently');
});

test('the delete-all controller refuses to report success on partial failure', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'controllers', 'journal.controller.js'),
    'utf8'
  );
  const fnMatch = source.match(/export async function deleteAllUserData[\s\S]*?\n}\n/);
  assert.ok(fnMatch, 'deleteAllUserData controller should be exported');
  assert.match(fnMatch[0], /result\.success/, 'controller should branch on result.success before responding');
});

test('postMessage only persists via appendMessagePair, after a successful Gemini reply', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'controllers', 'journal.controller.js'),
    'utf8'
  );
  const fnMatch = source.match(/export async function postMessage[\s\S]*?\n}\n/);
  assert.ok(fnMatch, 'postMessage should be exported');
  const body = fnMatch[0];

  assert.match(body, /appendMessagePair/, 'postMessage should persist user+model messages together, not separately');
  assert.doesNotMatch(
    body,
    /appendMessage\(req\.uid, journalId, \{ role: 'user'/,
    'postMessage should not persist the user message before Gemini has replied'
  );

  const geminiCallIndex = body.indexOf('sendJournalMessage(');
  const persistIndex = body.indexOf('appendMessagePair(');
  assert.ok(geminiCallIndex !== -1 && persistIndex !== -1, 'both the Gemini call and the persistence call should be present');
  assert.ok(geminiCallIndex < persistIndex, 'Gemini must be called BEFORE anything is persisted');
});
