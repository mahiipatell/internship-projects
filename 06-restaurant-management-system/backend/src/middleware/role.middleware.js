const ApiError = require('../utils/ApiError');

/**
 * Restricts a route to one or more roles. Must run after `authenticate`.
 * Usage: authorize('admin', 'cashier')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authorize };
