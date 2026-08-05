const asyncHandler = require('../utils/asyncHandler');

// Signup, login, and password reset are now handled entirely by Firebase
// Authentication on the client. This endpoint just confirms who the
// Firebase token belongs to (and, via the `protect` middleware, has
// already auto-provisioned/synced their Postgres row).
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = { getMe };
