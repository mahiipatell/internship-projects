const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');
const TmdbService = require('../services/tmdb.service');

// -----------------------------------------------------------------------
// Recommendation engine
//
// Strategy:
//  1. Build a "seed" set of titles the user has recently engaged with:
//     watch history, favorites, and highly-rated titles (score >= 7).
//  2. For each seed (most recent / highest signal first, capped to avoid
//     hammering TMDB), fetch TMDB's own "recommendations" and "similar"
//     endpoints - this is the strongest per-title signal TMDB offers.
//  3. Build a genre-affinity map from the user's favorite genres, favorites,
//     and ratings (weighted: explicit favorite genres > high ratings >
//     favorites > watch history) to re-rank the aggregated candidate pool.
//  4. Aggregate candidates, drop anything the user has already
//     watched/favorited/rated, dedupe, score, and sort.
//  5. If the user has no history at all (new user), fall back to trending +
//     popular so the dashboard is never empty.
// -----------------------------------------------------------------------

const MAX_SEEDS = 6; // how many titles we use as recommendation seeds
const RESULT_LIMIT = 30;

function genreWeightMap(favoriteGenres, ratings, favorites) {
  const weights = {};
  const bump = (genreId, amount) => {
    weights[genreId] = (weights[genreId] || 0) + amount;
  };

  favoriteGenres.forEach((g) => bump(g.genreId, 5));
  ratings
    .filter((r) => r.score >= 7)
    .forEach((r) => (r.genreIds || []).forEach((gid) => bump(gid, 3)));
  favorites.forEach((f) => (f.genreIds || []).forEach((gid) => bump(gid, 2)));

  return weights;
}

function scoreCandidate(item, weights) {
  const genreScore = (item.genre_ids || []).reduce((sum, gid) => sum + (weights[gid] || 0), 0);
  const popularityScore = Math.min(item.popularity || 0, 100) / 10; // normalize, cap influence
  const voteScore = (item.vote_average || 0) * 0.5;
  return genreScore + popularityScore + voteScore;
}

// @desc    Personalized recommendations for the current user
// @route   GET /api/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { mediaType = 'movie' } = req.query;
  const mt = mediaType === 'tv' ? 'tv' : 'movie';
  const mtEnum = mt.toUpperCase();

  const [history, favorites, ratings, favoriteGenres] = await Promise.all([
    prisma.watchHistory.findMany({
      where: { userId, mediaType: mtEnum },
      orderBy: { watchedAt: 'desc' },
      take: 10,
    }),
    prisma.favorite.findMany({ where: { userId, mediaType: mtEnum } }),
    prisma.rating.findMany({ where: { userId, mediaType: mtEnum } }),
    prisma.favoriteGenre.findMany({ where: { userId } }),
  ]);

  const excludeIds = new Set([
    ...history.map((h) => h.tmdbId),
    ...favorites.map((f) => f.tmdbId),
    ...ratings.map((r) => r.tmdbId),
  ]);

  // Build ordered seed list: highest signal first (top ratings, then favorites, then recent history)
  const seedIds = [
    ...ratings
      .filter((r) => r.score >= 7)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.tmdbId),
    ...favorites.map((f) => f.tmdbId),
    ...history.map((h) => h.tmdbId),
  ];
  const uniqueSeeds = [...new Set(seedIds)].slice(0, MAX_SEEDS);

  let candidates = [];

  if (uniqueSeeds.length === 0) {
    // Cold start: no personal data yet - use trending + popular as a baseline.
    const [trend, pop] = await Promise.all([
      TmdbService.trending(mt, 'week', 1),
      TmdbService.popular(mt, 1),
    ]);
    candidates = [...(trend.results || []), ...(pop.results || [])];
  } else {
    const seedResults = await Promise.all(
      uniqueSeeds.map(async (id) => {
        try {
          const [rec, sim] = await Promise.all([
            TmdbService.recommendations(mt, id, 1),
            TmdbService.similar(mt, id, 1),
          ]);
          return [...(rec.results || []), ...(sim.results || [])];
        } catch (err) {
          return []; // ignore titles TMDB can't resolve (e.g. removed content)
        }
      })
    );
    candidates = seedResults.flat();

    // Top up with genre-based discovery so results aren't too narrow.
    const topGenre = Object.entries(genreWeightMap(favoriteGenres, ratings, favorites)).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (topGenre) {
      try {
        const discover = await TmdbService.discoverByGenre(mt, topGenre[0], 1);
        candidates = [...candidates, ...(discover.results || [])];
      } catch (err) {
        // non-fatal
      }
    }
  }

  // Dedupe by id, drop already-seen titles.
  const seen = new Set();
  const deduped = candidates.filter((item) => {
    if (!item || !item.id) return false;
    if (excludeIds.has(item.id)) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Score & sort using genre affinity + popularity + rating.
  const weights = genreWeightMap(favoriteGenres, ratings, favorites);
  const ranked = deduped
    .map((item) => ({ ...item, media_type: item.media_type || mt, _score: scoreCandidate(item, weights) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, RESULT_LIMIT);

  res.status(200).json({
    success: true,
    basis: uniqueSeeds.length > 0 ? 'personalized' : 'trending_fallback',
    count: ranked.length,
    results: ranked,
  });
});

module.exports = { getRecommendations };
