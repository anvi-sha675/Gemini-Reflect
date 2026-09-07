import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generalRateLimiter } from '../middleware/rateLimit.js';
import { exportUserData } from '../controllers/export.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', generalRateLimiter, exportUserData);

export default router;
