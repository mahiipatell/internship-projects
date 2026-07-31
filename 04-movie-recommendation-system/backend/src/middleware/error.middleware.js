// Catches 404s and forwards to the central error handler.
function notFound(req, res, next) {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

// Central error handler. Any thrown error (sync in asyncHandler-wrapped
// controllers, or explicit next(err)) ends up here.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal server error';

  // Prisma known error codes
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists.`;
  }
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record was not found.';
  }
  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // Always log server-side, regardless of environment - this is what makes
  // failures visible in the terminal running `npm run dev` instead of only
  // ever showing up as an opaque status code in the browser/network tab.
  // 4xx from normal client mistakes (bad login, validation) are logged at
  // a lower volume; 5xx (our bugs / upstream failures) get the full stack.
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
    // eslint-disable-next-line no-console
    if (err.stack) console.error(err.stack);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = { notFound, errorHandler };
