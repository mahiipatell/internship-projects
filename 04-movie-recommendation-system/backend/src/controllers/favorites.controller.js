const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// @desc    Get current user's favorites
// @route   GET /api/favorites
const getFavorites = asyncHandler(async (req, res) => {
  const items = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    orderBy: { addedAt: 'desc' },
  });
  res.status(200).json({ success: true, count: items.length, items });
});

// @desc    Add an item to favorites
// @route   POST /api/favorites
const addToFavorites = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType, title, posterPath, releaseDate, voteAverage, genreIds = [] } = req.body;

  const item = await prisma.favorite.upsert({
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
      genreIds,
    },
  });

  res.status(201).json({ success: true, item });
});

// @desc    Remove an item from favorites
// @route   DELETE /api/favorites/:tmdbId/:mediaType
const removeFromFavorites = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType } = req.params;

  await prisma.favorite.delete({
    where: {
      userId_tmdbId_mediaType: {
        userId: req.user.id,
        tmdbId: Number(tmdbId),
        mediaType: mediaType.toUpperCase(),
      },
    },
  });

  res.status(200).json({ success: true, message: 'Removed from favorites.' });
});

module.exports = { getFavorites, addToFavorites, removeFromFavorites };
