const router = require('express').Router();
const billingController = require('../controllers/billing.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createBillRules, recordPaymentRules } = require('../validators/billing.validator');

router.use(authenticate);

router.get('/', authorize('admin', 'cashier'), billingController.list);
router.get('/:id', authorize('admin', 'cashier'), billingController.getOne);
router.post('/', authorize('admin', 'cashier'), createBillRules, validate, billingController.create);
router.put('/:id/payment', authorize('admin', 'cashier'), recordPaymentRules, validate, billingController.recordPayment);

module.exports = router;
