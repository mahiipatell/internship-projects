const { body } = require('express-validator');

const menuItemRules = [
  body('category_id').isInt({ min: 1 }).withMessage('A valid category_id is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('is_available').optional().isBoolean(),
  body('description').optional().isString(),
  body('image_url').optional().isString(),
];

module.exports = { menuItemRules };
