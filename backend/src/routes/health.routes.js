import { Router } from 'express';
const router = Router();

// Public, unauthenticated — used by Cloud Run for liveness checks.
router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

export default router;
