import rateLimit from 'express-rate-limit';

export const geminiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 Gemini calls per user per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.uid || req.ip,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.uid || req.ip,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
  },
});
