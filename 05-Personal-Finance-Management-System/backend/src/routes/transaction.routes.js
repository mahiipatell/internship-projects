const express = require('express');
const router = express.Router();

const {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getMonthlyAnalytics,
  getCategoryBreakdown,
  bulkImportTransactions,
  checkDuplicates,
  getInsights,
} = require('../controllers/transaction.controller');
const { transactionValidation, listQueryValidation } = require('../validations/transaction.validation');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// Analytics (must be declared before the "/:id" route to avoid collisions)
router.get('/summary', getSummary);
router.get('/analytics/monthly', getMonthlyAnalytics);
router.get('/analytics/category-breakdown', getCategoryBreakdown);
router.get('/insights', getInsights);

// CSV Import Center (also before "/:id")
router.post('/import/check-duplicates', checkDuplicates);
router.post('/import/bulk', bulkImportTransactions);

router.get('/', listQueryValidation, validate, listTransactions);
router.post('/', transactionValidation, validate, createTransaction);
router.get('/:id', getTransaction);
router.put('/:id', transactionValidation, validate, updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
