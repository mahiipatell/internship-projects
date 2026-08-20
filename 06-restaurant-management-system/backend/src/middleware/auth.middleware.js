const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

/**
 * Verifies the Bearer JWT and attaches the authenticated user to req.user.
 * Rejects if the user no longer exists or has been deactivated.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await userService.getUserById(decoded.id);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('User account is inactive or no longer exists');
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
