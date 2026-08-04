const { body } = require('express-validator');

const incomeValidation = [
  body('monthlyIncome').isFloat({ gt: 0 }).withMessage('Monthly income must be a positive number'),
  body('savingsGoal')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Savings goal cannot be negative'),
];

const allocationValidation = [
  body('name').trim().notEmpty().withMessage('Allocation name is required').isLength({ max: 50 }),
  body('icon').optional({ checkFalsy: true }).isLength({ max: 10 }),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be zero or more'),
];

module.exports = { incomeValidation, allocationValidation };
