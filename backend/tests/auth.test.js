import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth } from '../src/middleware/auth.js';

test('requireAuth rejects requests with no Authorization header', async () => {
  const req = { headers: {} };
  let statusCode, body;
  const res = {
    status(code) { statusCode = code; return this; },
    json(payload) { body = payload; return this; },
  };
  await requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(statusCode, 401);
  assert.match(body.error, /Missing or malformed/);
});

test('requireAuth rejects a non-Bearer scheme', async () => {
  const req = { headers: { authorization: 'Basic abc123' } };
  let statusCode;
  const res = { status(c) { statusCode = c; return this; }, json() { return this; } };
  await requireAuth(req, res, () => assert.fail('next() should not be called'));
  assert.equal(statusCode, 401);
});
