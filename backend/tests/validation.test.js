import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessageBody, validateJournalId, enforceConversationLength, LIMITS } from '../src/middleware/validate.js';

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

test('validateMessageBody rejects empty content', () => {
  const req = { body: { content: '   ' } };
  const res = mockRes();
  validateMessageBody(req, res, () => assert.fail('should not call next'));
  assert.equal(res.statusCode, 400);
});

test('validateMessageBody rejects overly long content', () => {
  const req = { body: { content: 'x'.repeat(LIMITS.MAX_MESSAGE_LENGTH + 1) } };
  const res = mockRes();
  validateMessageBody(req, res, () => assert.fail('should not call next'));
  assert.equal(res.statusCode, 400);
});

test('validateMessageBody accepts valid content', () => {
  const req = { body: { content: 'Feeling good about today.' } };
  const res = mockRes();
  let called = false;
  validateMessageBody(req, res, () => { called = true; });
  assert.ok(called);
});

test('validateJournalId rejects path-traversal-like ids', () => {
  const req = { params: { journalId: '../../etc/passwd' } };
  const res = mockRes();
  validateJournalId(req, res, () => assert.fail('should not call next'));
  assert.equal(res.statusCode, 400);
});

test('enforceConversationLength blocks at the configured cap', () => {
  assert.equal(enforceConversationLength(LIMITS.MAX_MESSAGES_PER_JOURNAL), false);
  assert.equal(enforceConversationLength(0), true);
});
