const express = require('express');
const router = express.Router();

const { updateProfile, changePassword } = require('../controllers/user.controller');
const {
  updateProfileValidation,
  changePasswordValidation,
} = require('../validations/auth.validation');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.put('/me', updateProfileValidation, validate, updateProfile);
router.put('/change-password', changePasswordValidation, validate, changePassword);

module.exports = router;
