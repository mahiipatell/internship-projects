const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/auth.utils');

// @desc    Update profile (name, bio, avatarUrl)
// @route   PATCH /api/users/me
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatarUrl } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Change password
// @route   PATCH /api/users/me/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect.');
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  res.status(200).json({ success: true, message: 'Password updated successfully.' });
});

// @desc    Delete own account (cascades to watchlist/favorites/ratings/history)
// @route   DELETE /api/users/me
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: req.user.id } });
  res.status(200).json({ success: true, message: 'Account deleted successfully.' });
});

// @desc    Get user's favorite genres
// @route   GET /api/users/me/genres
// @access  Private
const getFavoriteGenres = asyncHandler(async (req, res) => {
  const genres = await prisma.favoriteGenre.findMany({ where: { userId: req.user.id } });
  res.status(200).json({ success: true, genres });
});

// @desc    Set (replace) user's favorite genres
// @route   PUT /api/users/me/genres
// @access  Private
const setFavoriteGenres = asyncHandler(async (req, res) => {
  const { genres } = req.body; // [{ genreId, genreName }]

  await prisma.$transaction([
    prisma.favoriteGenre.deleteMany({ where: { userId: req.user.id } }),
    prisma.favoriteGenre.createMany({
      data: genres.map((g) => ({ userId: req.user.id, genreId: g.genreId, genreName: g.genreName })),
      skipDuplicates: true,
    }),
  ]);

  const updated = await prisma.favoriteGenre.findMany({ where: { userId: req.user.id } });
  res.status(200).json({ success: true, genres: updated });
});

// @desc    Aggregate dashboard statistics for the current user
// @route   GET /api/users/me/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [watchlistCount, favoritesCount, ratingsCount, historyCount, ratings, genres] =
    await Promise.all([
      prisma.watchlist.count({ where: { userId } }),
      prisma.favorite.count({ where: { userId } }),
      prisma.rating.count({ where: { userId } }),
      prisma.watchHistory.count({ where: { userId } }),
      prisma.rating.findMany({ where: { userId }, select: { score: true } }),
      prisma.favoriteGenre.findMany({ where: { userId } }),
    ]);

  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0;

  res.status(200).json({
    success: true,
    stats: {
      watchlistCount,
      favoritesCount,
      ratingsCount,
      historyCount,
      averageRatingGiven: Number(averageRating.toFixed(1)),
      favoriteGenreCount: genres.length,
    },
  });
});

module.exports = {
  updateProfile,
  changePassword,
  deleteAccount,
  getFavoriteGenres,
  setFavoriteGenres,
  getStats,
};
