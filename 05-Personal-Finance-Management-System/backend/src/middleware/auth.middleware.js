const admin = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const UserModel = require('../models/user.model');

/**
 * Verifies the Firebase ID token sent by the client, then finds (or
 * transparently creates) the matching Postgres user row keyed on
 * firebase_uid. This is the only place the two identity systems meet —
 * every other controller just uses req.user.id like before.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    throw new ApiError(401, 'Not authorized, token invalid or expired');
  }

  let user = await UserModel.findByFirebaseUid(decoded.uid);

  if (!user) {
    user = await UserModel.createFromFirebase({
      firebaseUid: decoded.uid,
      email: decoded.email,
      name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'User'),
      emailVerified: decoded.email_verified,
    });
  } else if (user.email_verified !== !!decoded.email_verified) {
    user = await UserModel.updateEmailVerified(user.id, !!decoded.email_verified);
  }

  req.user = user;
  next();
});

module.exports = { protect };
