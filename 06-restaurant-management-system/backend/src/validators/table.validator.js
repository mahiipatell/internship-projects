const { body } = require('express-validator');

const tableRules = [
  body('table_number').trim().notEmpty().withMessage('Table number is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('status').optional().isIn(['available', 'occupied', 'reserved']),
];

module.exports = { tableRules };
