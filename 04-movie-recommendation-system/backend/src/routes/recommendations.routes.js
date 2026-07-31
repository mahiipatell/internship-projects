const express = require('express');
const { getRecommendations } = require('../controllers/recommendations.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, getRecommendations);

module.exports = router;
