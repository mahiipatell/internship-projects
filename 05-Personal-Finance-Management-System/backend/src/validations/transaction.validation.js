const { body, query } = require('express-validator');

const transactionValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('categoryId').isInt().withMessage('A valid category is required'),
  body('date').isISO8601().withMessage('A valid date is required'),
  body('notes').optional({ checkFalsy: true }).isLength({ max: 1000 }),
  body('accountId').optional({ checkFalsy: true }).isInt().withMessage('Invalid account'),
];

const listQueryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { transactionValidation, listQueryValidation };
