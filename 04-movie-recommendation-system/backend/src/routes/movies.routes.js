const express = require('express');
const {
  trending,
  popular,
  topRated,
  upcoming,
  nowPlaying,
  genres,
  byGenre,
  search,
  details,
  person,
} = require('../controllers/movies.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/trending', trending);
router.get('/popular', popular);
router.get('/top-rated', topRated);
router.get('/upcoming', upcoming);
router.get('/now-playing', nowPlaying);
router.get('/genres', genres);
router.get('/genre/:genreId', byGenre);
router.get('/search', search);
router.get('/person/:id', person);
router.get('/:mediaType/:id', optionalAuth, details);

module.exports = router;
