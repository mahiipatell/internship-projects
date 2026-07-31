const express = require('express');
const { body } = require('express-validator');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlist.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getWatchlist);
router.post(
  '/',
  [
    body('tmdbId').isInt(),
    body('mediaType').isIn(['movie', 'tv', 'MOVIE', 'TV']),
    body('title').notEmpty(),
  ],
  validate,
  addToWatchlist
);
router.delete('/:tmdbId/:mediaType', removeFromWatchlist);

module.exports = router;
