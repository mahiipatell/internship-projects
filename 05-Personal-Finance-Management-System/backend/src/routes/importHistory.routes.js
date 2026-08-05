const express = require('express');
const router = express.Router();

const {
  getHistory,
  getHistoryRecord,
  createHistoryRecord,
  deleteHistoryRecord,
} = require('../controllers/importHistory.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getHistory);
router.post('/', createHistoryRecord);
router.get('/:id', getHistoryRecord);
router.delete('/:id', deleteHistoryRecord);

module.exports = router;
