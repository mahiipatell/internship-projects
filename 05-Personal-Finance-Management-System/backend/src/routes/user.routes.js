const express = require('express');
const router = express.Router();

const { updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.put('/me', updateProfile);

module.exports = router;
