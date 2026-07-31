const express = require('express');
const { body } = require('express-validator');
const { getFavorites, addToFavorites, removeFromFavorites } = require('../controllers/favorites.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getFavorites);
router.post(
  '/',
  [
    body('tmdbId').isInt(),
    body('mediaType').isIn(['movie', 'tv', 'MOVIE', 'TV']),
    body('title').notEmpty(),
  ],
  validate,
  addToFavorites
);
router.delete('/:tmdbId/:mediaType', removeFromFavorites);

module.exports = router;
