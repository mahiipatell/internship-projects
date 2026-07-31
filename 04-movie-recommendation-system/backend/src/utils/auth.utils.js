const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { env } = require('../config/env');

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Sends the JWT both as an httpOnly cookie (safer, used by the SPA by default)
// and returns it in the JSON body (useful for non-browser/API clients).
function sendAuthResponse(res, statusCode, user, token) {
  const cookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  res.cookie(env.jwtCookieName, token, cookieOptions);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  });
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken, sendAuthResponse };
