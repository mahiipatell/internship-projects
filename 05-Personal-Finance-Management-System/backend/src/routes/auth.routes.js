const express = require('express');
const router = express.Router();

const { getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/me', protect, getMe);

module.exports = router;
