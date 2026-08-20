const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/categories', require('./category.routes'));
router.use('/menu-items', require('./menu.routes'));
router.use('/tables', require('./table.routes'));
router.use('/orders', require('./order.routes'));
router.use('/bills', require('./billing.routes'));
router.use('/invoices', require('./invoice.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./report.routes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

module.exports = router;
