const router = require('express').Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate, authorize('admin', 'cashier'));

router.post('/bill/:billId', invoiceController.generate);
router.get('/download/:invoiceNumber', invoiceController.download);

module.exports = router;
