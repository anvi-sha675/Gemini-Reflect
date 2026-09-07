import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { geminiRateLimiter, generalRateLimiter } from '../middleware/rateLimit.js';
import * as ctrl from '../controllers/insights.controller.js';

const router = Router();
router.use(requireAuth);

router.post('/generate', geminiRateLimiter, ctrl.getInsights);
router.get('/latest', generalRateLimiter, ctrl.getLatest);

router.post('/timeline/generate', geminiRateLimiter, ctrl.getGrowthTimeline);
router.get('/timeline/latest', generalRateLimiter, ctrl.getLatestTimelineHandler);

export default router;
