const express = require('express');
const { body } = require('express-validator');
const { getRatings, rateTitle, deleteRating } = require('../controllers/ratings.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getRatings);
router.post(
  '/',
  [
    body('tmdbId').isInt(),
    body('mediaType').isIn(['movie', 'tv', 'MOVIE', 'TV']),
    body('title').notEmpty(),
    body('score').isFloat({ min: 1, max: 10 }),
    body('review').optional().isLength({ max: 2000 }),
  ],
  validate,
  rateTitle
);
router.delete('/:tmdbId/:mediaType', deleteRating);

module.exports = router;
