export function errorHandler(err, req, res, next) { 
  const status = err.statusCode || 500;

  console.error(`[error] ${req.method} ${req.path} -> ${status}: ${err.publicMessage || err.message}`);

  res.status(status).json({
    error: err.publicMessage || 'Something went wrong. Please try again.',
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found.' });
}
