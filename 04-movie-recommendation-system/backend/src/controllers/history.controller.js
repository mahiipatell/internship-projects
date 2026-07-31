const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// @desc    Get current user's watch history (most recent first)
// @route   GET /api/history
const getHistory = asyncHandler(async (req, res) => {
  const items = await prisma.watchHistory.findMany({
    where: { userId: req.user.id },
    orderBy: { watchedAt: 'desc' },
    take: 200,
  });
  res.status(200).json({ success: true, count: items.length, items });
});

// @desc    Log a title as watched (feeds the recommendation engine)
// @route   POST /api/history
const addToHistory = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType, title, posterPath, genreIds = [] } = req.body;

  const item = await prisma.watchHistory.create({
    data: {
      userId: req.user.id,
      tmdbId,
      mediaType: mediaType.toUpperCase(),
      title,
      posterPath,
      genreIds,
    },
  });

  res.status(201).json({ success: true, item });
});

// @desc    Remove a single history entry
// @route   DELETE /api/history/:id
const removeHistoryEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await prisma.watchHistory.deleteMany({ where: { id, userId: req.user.id } });
  if (result.count === 0) {
    res.status(404);
    throw new Error('History entry not found.');
  }
  res.status(200).json({ success: true, message: 'History entry removed.' });
});

// @desc    Clear all watch history
// @route   DELETE /api/history
const clearHistory = asyncHandler(async (req, res) => {
  await prisma.watchHistory.deleteMany({ where: { userId: req.user.id } });
  res.status(200).json({ success: true, message: 'Watch history cleared.' });
});

module.exports = { getHistory, addToHistory, removeHistoryEntry, clearHistory };
