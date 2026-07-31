const express = require('express');
const { body } = require('express-validator');
const {
  getHistory,
  addToHistory,
  removeHistoryEntry,
  clearHistory,
} = require('../controllers/history.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getHistory);
router.post(
  '/',
  [body('tmdbId').isInt(), body('mediaType').isIn(['movie', 'tv', 'MOVIE', 'TV']), body('title').notEmpty()],
  validate,
  addToHistory
);
router.delete('/:id', removeHistoryEntry);
router.delete('/', clearHistory);

module.exports = router;
