import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import healthRoutes from './routes/health.routes.js';
import journalRoutes from './routes/journal.routes.js';
import insightsRoutes from './routes/insights.routes.js';
import exportRoutes from './routes/export.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet());
app.use(express.json({ limit: '256kb' }));

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : !isProduction,
  credentials: true,
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api', healthRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/export', exportRoutes);

const staticDir = path.join(__dirname, '..', 'public');
app.use(express.static(staticDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(staticDir, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;
