const router = require('express').Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createOrderRules, updateOrderItemsRules, updateOrderStatusRules } = require('../validators/order.validator');

router.use(authenticate);

router.get('/', orderController.list);
router.get('/:id', orderController.getOne);
router.post('/', authorize('admin', 'waiter'), createOrderRules, validate, orderController.create);
router.put('/:id/items', authorize('admin', 'waiter'), updateOrderItemsRules, validate, orderController.updateItems);
router.put('/:id/status', authorize('admin', 'waiter', 'cashier'), updateOrderStatusRules, validate, orderController.updateStatus);
router.delete('/:id', authorize('admin', 'waiter'), orderController.remove);

module.exports = router;
