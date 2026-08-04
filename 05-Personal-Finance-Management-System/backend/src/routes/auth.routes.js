const express = require('express');
const router = express.Router();

const { signup, login, getMe } = require('../controllers/auth.controller');
const { signupValidation, loginValidation } = require('../validations/auth.validation');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', signupValidation, validate, signup);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
