const { validationResult } = require('express-validator');

// Runs after an array of express-validator checks; if any failed, responds
// with 422 and the list of field errors instead of reaching the controller.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { validate };
