const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/categories', require('./category.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/budget', require('./budget.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
