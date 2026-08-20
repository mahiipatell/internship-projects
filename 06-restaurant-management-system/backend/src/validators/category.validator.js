const { body } = require('express-validator');

const categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
];

module.exports = { categoryRules };
