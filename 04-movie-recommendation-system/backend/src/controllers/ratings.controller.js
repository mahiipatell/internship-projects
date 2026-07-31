const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

// @desc    Get current user's ratings
// @route   GET /api/ratings
const getRatings = asyncHandler(async (req, res) => {
  const items = await prisma.rating.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, count: items.length, items });
});

// @desc    Create or update a rating (and optional review) for a title
// @route   POST /api/ratings
const rateTitle = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType, title, posterPath, score, review } = req.body;

  if (score < 1 || score > 10) {
    res.status(400);
    throw new Error('Rating score must be between 1 and 10.');
  }

  const rating = await prisma.rating.upsert({
    where: {
      userId_tmdbId_mediaType: { userId: req.user.id, tmdbId, mediaType: mediaType.toUpperCase() },
    },
    update: { score, review, title, posterPath },
    create: {
      userId: req.user.id,
      tmdbId,
      mediaType: mediaType.toUpperCase(),
      title,
      posterPath,
      score,
      review,
    },
  });

  res.status(201).json({ success: true, rating });
});

// @desc    Delete a rating
// @route   DELETE /api/ratings/:tmdbId/:mediaType
const deleteRating = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType } = req.params;

  await prisma.rating.delete({
    where: {
      userId_tmdbId_mediaType: {
        userId: req.user.id,
        tmdbId: Number(tmdbId),
        mediaType: mediaType.toUpperCase(),
      },
    },
  });

  res.status(200).json({ success: true, message: 'Rating removed.' });
});

module.exports = { getRatings, rateTitle, deleteRating };
