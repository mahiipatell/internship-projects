const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate, authorize('admin'));

router.get('/sales', reportController.sales);
router.get('/best-sellers', reportController.bestSellers);
router.get('/revenue', reportController.revenue);

module.exports = router;
