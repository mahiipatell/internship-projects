const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // Postgres unique violation
    if (error.code === '23505') {
      error = ApiError.conflict('A record with these details already exists');
    } else if (error.code === '23503') {
      error = ApiError.badRequest('This action violates a data relationship (foreign key) constraint');
    } else if (error.code === '23514') {
      error = ApiError.badRequest('One or more values violate a data constraint');
    } else if (error.code === '22P02') {
      // e.g. a non-numeric value passed where an integer id/column was expected
      error = ApiError.badRequest('Invalid identifier or value format');
    } else if (error.code === '22007' || error.code === '22008') {
      // e.g. a malformed value passed to a date/timestamp filter (?from=, ?to=)
      error = ApiError.badRequest('Invalid date format. Use YYYY-MM-DD');
    } else if (error.code === '23502') {
      error = ApiError.badRequest('A required field is missing');
    } else if (error.code === '22003') {
      error = ApiError.badRequest('A numeric value is out of the allowed range');
    } else {
      error = ApiError.internal(error.message || 'Something went wrong');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    details: error.details || undefined,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFoundHandler };
