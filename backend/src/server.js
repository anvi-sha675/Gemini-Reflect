import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`Gemini Reflect backend listening on port ${port}`);
});

// Graceful shutdown for Cloud Run SIGTERM on scale-down/redeploy.
function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
