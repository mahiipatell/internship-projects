/**
 * Central error-handling middleware.
 *
 * Controllers should call `next(err)` (or throw inside an async handler
 * wrapped by `asyncHandler`) instead of formatting error responses
 * themselves. This keeps the error response shape consistent across the
 * whole API and gives us one place to log errors.
 */
function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Something went wrong on the server';

  res.status(statusCode).json({
    success: false,
    message,
    // Only leak stack traces outside production, to help local debugging
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFound };
