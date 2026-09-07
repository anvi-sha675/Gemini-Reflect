import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as db from '../src/services/firestore.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const controllersDir = path.join(__dirname, '..', 'src', 'controllers');

const DANGEROUS_PATTERNS = [
  /req\.body\.uid/,
  /req\.body\.userId/,
  /req\.params\.uid/,
  /req\.params\.userId/,
  /req\.query\.uid/,
  /req\.query\.userId/,
];

function readControllerFiles() {
  return fs.readdirSync(controllersDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ name: f, source: fs.readFileSync(path.join(controllersDir, f), 'utf8') }));
}

test('no controller reads a client-supplied uid/userId as trusted identity', () => {
  const files = readControllerFiles();
  assert.ok(files.length > 0, 'expected controller files to exist');

  for (const { name, source } of files) {
    for (const pattern of DANGEROUS_PATTERNS) {
      assert.doesNotMatch(source, pattern, `${name} appears to trust a client-supplied uid via ${pattern}`);
    }
  }
});

test('every controller that touches user data references req.uid', () => {
  const files = readControllerFiles();
  const dataControllers = files.filter((f) => /journal|insight|export/i.test(f.name));
  assert.ok(dataControllers.length > 0, 'expected data controllers to exist');

  for (const { name, source } of dataControllers) {
    assert.match(source, /req\.uid/, `${name} should scope its operations using req.uid`);
  }
});

test('every journal-scoped Firestore accessor is exported and requires uid as its first parameter', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'services', 'firestore.service.js'),
    'utf8'
  );
  const journalScopedFns = ['getJournal', 'appendMessagePair', 'listMessages', 'deleteJournal', 'endJournalWithSummary'];

  for (const fn of journalScopedFns) {
    assert.equal(typeof db[fn], 'function', `${fn} should be exported from firestore.service.js`);
    assert.ok(db[fn].length >= 1, `${fn} should require at least a uid argument`);

    const match = source.match(new RegExp(`function ${fn}\\(([^)]*)\\)`));
    assert.ok(match, `${fn} should be defined in the source`);
    assert.match(match[1], /uid/, `${fn}'s signature should name a uid parameter`);
  }
});
