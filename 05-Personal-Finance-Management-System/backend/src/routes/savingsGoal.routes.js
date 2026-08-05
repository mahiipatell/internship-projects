const express = require('express');
const router = express.Router();

const {
  getGoals,
  createGoal,
  updateGoal,
  contribute,
  deleteGoal,
} = require('../controllers/savingsGoal.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.post('/:id/contribute', contribute);
router.delete('/:id', deleteGoal);

module.exports = router;
