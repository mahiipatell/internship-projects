const asyncHandler = require('express-async-handler');
const TmdbService = require('../services/tmdb.service');
const prisma = require('../config/prisma');

// @desc    Trending movies/tv/people
// @route   GET /api/movies/trending?mediaType=all&timeWindow=week&page=1
const trending = asyncHandler(async (req, res) => {
  const { mediaType = 'all', timeWindow = 'week', page = 1 } = req.query;
  const data = await TmdbService.trending(mediaType, timeWindow, page);
  res.status(200).json({ success: true, ...data });
});

// @desc    Popular movies or tv shows
// @route   GET /api/movies/popular?mediaType=movie&page=1
const popular = asyncHandler(async (req, res) => {
  const { mediaType = 'movie', page = 1 } = req.query;
  const data = await TmdbService.popular(mediaType, page);
  res.status(200).json({ success: true, ...data });
});

// @desc    Top rated movies or tv shows
// @route   GET /api/movies/top-rated?mediaType=movie&page=1
const topRated = asyncHandler(async (req, res) => {
  const { mediaType = 'movie', page = 1 } = req.query;
  const data = await TmdbService.topRated(mediaType, page);
  res.status(200).json({ success: true, ...data });
});

// @desc    Upcoming movies
// @route   GET /api/movies/upcoming?page=1
const upcoming = asyncHandler(async (req, res) => {
  const { page = 1 } = req.query;
  const data = await TmdbService.upcoming(page);
  res.status(200).json({ success: true, ...data });
});

// @desc    Now playing (movies) / on the air (tv)
// @route   GET /api/movies/now-playing?mediaType=movie&page=1
const nowPlaying = asyncHandler(async (req, res) => {
  const { mediaType = 'movie', page = 1 } = req.query;
  const data =
    mediaType === 'tv' ? await TmdbService.onTheAir(page) : await TmdbService.nowPlaying(page);
  res.status(200).json({ success: true, ...data });
});

// @desc    Genre list
// @route   GET /api/movies/genres?mediaType=movie
const genres = asyncHandler(async (req, res) => {
  const { mediaType = 'movie' } = req.query;
  const data = await TmdbService.genreList(mediaType);
  res.status(200).json({ success: true, ...data });
});

// @desc    Discover by genre
// @route   GET /api/movies/genre/:genreId?mediaType=movie&page=1&sortBy=popularity.desc
const byGenre = asyncHandler(async (req, res) => {
  const { genreId } = req.params;
  const { mediaType = 'movie', page = 1, sortBy = 'popularity.desc' } = req.query;
  const data = await TmdbService.discoverByGenre(mediaType, genreId, page, sortBy);
  res.status(200).json({ success: true, ...data });
});

// @desc    Search across movies, tv, and people
// @route   GET /api/movies/search?query=...&type=multi&page=1
const search = asyncHandler(async (req, res) => {
  const { query, type = 'multi', page = 1 } = req.query;
  if (!query || !query.trim()) {
    res.status(400);
    throw new Error('A search query is required.');
  }

  let data;
  if (type === 'movie') data = await TmdbService.searchMovies(query, page);
  else if (type === 'tv') data = await TmdbService.searchTv(query, page);
  else if (type === 'person') data = await TmdbService.searchPeople(query, page);
  else data = await TmdbService.searchMulti(query, page);

  res.status(200).json({ success: true, ...data });
});

// @desc    Full details for a movie or tv show (credits, videos, similar, etc.)
// @route   GET /api/movies/:mediaType/:id
const details = asyncHandler(async (req, res) => {
  const { mediaType, id } = req.params;
  if (!['movie', 'tv'].includes(mediaType)) {
    res.status(400);
    throw new Error('mediaType must be "movie" or "tv".');
  }
  const data = await TmdbService.details(mediaType, id);

  // Attach the current user's personal data for this title, if logged in.
  let personal = null;
  if (req.user) {
    const tmdbId = Number(id);
    const mt = mediaType.toUpperCase();
    const [inWatchlist, inFavorites, rating] = await Promise.all([
      prisma.watchlist.findUnique({
        where: { userId_tmdbId_mediaType: { userId: req.user.id, tmdbId, mediaType: mt } },
      }),
      prisma.favorite.findUnique({
        where: { userId_tmdbId_mediaType: { userId: req.user.id, tmdbId, mediaType: mt } },
      }),
      prisma.rating.findUnique({
        where: { userId_tmdbId_mediaType: { userId: req.user.id, tmdbId, mediaType: mt } },
      }),
    ]);
    personal = { inWatchlist: !!inWatchlist, inFavorites: !!inFavorites, userRating: rating?.score || null };
  }

  res.status(200).json({ success: true, ...data, personal });
});

// @desc    Person (actor/crew) details with combined credits
// @route   GET /api/movies/person/:id
const person = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await TmdbService.personDetails(id);
  res.status(200).json({ success: true, ...data });
});

module.exports = { trending, popular, topRated, upcoming, nowPlaying, genres, byGenre, search, details, person };
