const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/summary', dashboardController.summary);

module.exports = router;
