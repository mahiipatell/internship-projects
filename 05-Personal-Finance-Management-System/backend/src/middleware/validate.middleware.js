const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after an array of express-validator checks. If any failed, throws
 * a single 422 ApiError with all messages collected, instead of each
 * controller having to check `validationResult` itself.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new ApiError(422, message));
  }
  next();
}

module.exports = validate;
