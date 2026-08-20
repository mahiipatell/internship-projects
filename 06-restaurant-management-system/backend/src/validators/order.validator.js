const { body } = require('express-validator');

// Shared by order creation and order item updates so both endpoints
// reject a missing/malformed `items` array before it ever reaches the
// service layer (which otherwise throws an unguarded TypeError on a
// non-array `items`).
const itemsRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menu_item_id').isInt({ min: 1 }).withMessage('Each item needs a valid menu_item_id'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
];

const createOrderRules = [
  body('table_id').isInt({ min: 1 }).withMessage('A valid table_id is required'),
  ...itemsRules,
];

const updateOrderItemsRules = [...itemsRules];

// 'completed' is intentionally excluded: an order is only ever marked
// completed as a side effect of billing.service.createBill, never via a
// direct manual status update, so a bill can never be skipped.
const updateOrderStatusRules = [
  body('status').isIn(['pending', 'preparing', 'served', 'cancelled']).withMessage('Invalid status'),
];

module.exports = { createOrderRules, updateOrderItemsRules, updateOrderStatusRules };
