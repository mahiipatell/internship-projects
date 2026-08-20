const { body } = require('express-validator');

const createBillRules = [
  body('order_id').isInt({ min: 1 }).withMessage('A valid order_id is required'),
  body('discount_percent').optional().isFloat({ min: 0, max: 100 }),
  body('gst_percent').optional().isFloat({ min: 0, max: 100 }),
  body('payment_method').optional().isIn(['cash', 'card', 'upi', 'other']),
];

const recordPaymentRules = [
  body('payment_method').optional().isIn(['cash', 'card', 'upi', 'other']),
  body('payment_status').optional().isIn(['pending', 'paid', 'refunded']),
];

module.exports = { createBillRules, recordPaymentRules };
