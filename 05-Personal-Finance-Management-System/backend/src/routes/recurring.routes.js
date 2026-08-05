const express = require('express');
const router = express.Router();

const {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  processRecurring,
} = require('../controllers/recurring.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getRecurring);
router.post('/', createRecurring);
router.put('/:id', updateRecurring);
router.delete('/:id', deleteRecurring);
router.post('/process', processRecurring);

module.exports = router;
