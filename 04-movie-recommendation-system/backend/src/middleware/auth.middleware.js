const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../utils/auth.utils');
const { env } = require('../config/env');
const prisma = require('../config/prisma');

// Reads the JWT from the Authorization header (Bearer) or the httpOnly cookie,
// verifies it, and attaches the authenticated user to req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies[env.jwtCookieName]) {
    token = req.cookies[env.jwtCookieName];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized. Please log in.');
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401);
      throw new Error('User belonging to this token no longer exists.');
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired session. Please log in again.');
  }
});

// Like `protect`, but does not fail the request if no/invalid token is present.
// Used on public endpoints that optionally personalize the response (e.g. movie details).
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies[env.jwtCookieName]) {
    token = req.cookies[env.jwtCookieName];
  }

  if (!token) return next();

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) req.user = user;
  } catch (err) {
    // Ignore invalid token on optional routes; proceed as anonymous.
  }
  next();
});

module.exports = { protect, optionalAuth };

