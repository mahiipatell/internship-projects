const { body } = require('express-validator');

const createUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'cashier', 'waiter']).withMessage('Role must be admin, cashier, or waiter'),
  body('phone').optional().isString(),
];

const updateUserRules = [
  body('name').optional().trim().notEmpty(),
  body('role').optional().isIn(['admin', 'cashier', 'waiter']),
  body('phone').optional().isString(),
  body('is_active').optional().isBoolean(),
];

const changePasswordRules = [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = { createUserRules, updateUserRules, changePasswordRules };
