const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// @desc    Get current user's watchlist
// @route   GET /api/watchlist
const getWatchlist = asyncHandler(async (req, res) => {
  const items = await prisma.watchlist.findMany({
    where: { userId: req.user.id },
    orderBy: { addedAt: 'desc' },
  });
  res.status(200).json({ success: true, count: items.length, items });
});

// @desc    Add an item to the watchlist
// @route   POST /api/watchlist
const addToWatchlist = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType, title, posterPath, releaseDate, voteAverage } = req.body;

  const item = await prisma.watchlist.upsert({
    where: {
      userId_tmdbId_mediaType: { userId: req.user.id, tmdbId, mediaType: mediaType.toUpperCase() },
    },
    update: {},
    create: {
      userId: req.user.id,
      tmdbId,
      mediaType: mediaType.toUpperCase(),
      title,
      posterPath,
      releaseDate,
      voteAverage,
    },
  });

  res.status(201).json({ success: true, item });
});

// @desc    Remove an item from the watchlist
// @route   DELETE /api/watchlist/:tmdbId/:mediaType
const removeFromWatchlist = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType } = req.params;

  await prisma.watchlist.delete({
    where: {
      userId_tmdbId_mediaType: {
        userId: req.user.id,
        tmdbId: Number(tmdbId),
        mediaType: mediaType.toUpperCase(),
      },
    },
  });

  res.status(200).json({ success: true, message: 'Removed from watchlist.' });
});

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
