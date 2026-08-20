const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login(email, password);
  sendSuccess(res, 200, { token, user }, 'Login successful');
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, req.user, 'Current user fetched');
});

const logout = asyncHandler(async (req, res) => {
  // JWTs are stateless; the client discards the token. Endpoint kept
  // for a consistent API surface and future token-blacklisting.
  sendSuccess(res, 200, null, 'Logged out successfully');
});

module.exports = { login, me, logout };
