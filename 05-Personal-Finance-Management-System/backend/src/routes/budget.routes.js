const express = require('express');
const router = express.Router();

const {
  getBudget,
  enableBudget,
  updateIncome,
  addAllocation,
  updateAllocation,
  deleteAllocation,
  disableBudget,
  resetBudget,
} = require('../controllers/budget.controller');
const { incomeValidation, allocationValidation } = require('../validations/budget.validation');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getBudget);
router.post('/', incomeValidation, validate, enableBudget);
router.put('/', incomeValidation, validate, updateIncome);

router.post('/allocations', allocationValidation, validate, addAllocation);
router.put('/allocations/:id', allocationValidation, validate, updateAllocation);
router.delete('/allocations/:id', deleteAllocation);

router.post('/disable', disableBudget);
router.post('/reset', resetBudget);

module.exports = router;
