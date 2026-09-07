import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { geminiRateLimiter, generalRateLimiter } from '../middleware/rateLimit.js';
import { validateMessageBody, validateJournalId } from '../middleware/validate.js';
import * as ctrl from '../controllers/journal.controller.js';

const router = Router();
router.use(requireAuth);

router.post('/', generalRateLimiter, ctrl.createJournal);
router.get('/', generalRateLimiter, ctrl.listJournals);
router.get('/:journalId', generalRateLimiter, validateJournalId, ctrl.getJournal);
router.post('/:journalId/messages', geminiRateLimiter, validateJournalId, validateMessageBody, ctrl.postMessage);
router.post('/:journalId/end', geminiRateLimiter, validateJournalId, ctrl.endJournal);
router.delete('/:journalId', generalRateLimiter, validateJournalId, ctrl.deleteJournal);

router.delete('/', generalRateLimiter, ctrl.deleteAllUserData);

export default router;
