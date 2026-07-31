const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { hashPassword, comparePassword, signToken, sendAuthResponse } = require('../utils/auth.utils');
const { env } = require('../config/env');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists.');
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hashed },
  });

  const token = signToken({ id: user.id });
  sendAuthResponse(res, 201, user, token);
});

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  const token = signToken({ id: user.id });
  sendAuthResponse(res, 200, user, token);
});

// @desc    Log out (clears auth cookie)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.jwtCookieName);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const { id, name, email, avatarUrl, bio, createdAt } = req.user;
  res.status(200).json({ success: true, user: { id, name, email, avatarUrl, bio, createdAt } });
});

module.exports = { register, login, logout, getMe };
