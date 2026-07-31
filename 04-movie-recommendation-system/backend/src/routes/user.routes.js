const express = require('express');
const { body } = require('express-validator');
const {
  updateProfile,
  changePassword,
  deleteAccount,
  getFavoriteGenres,
  setFavoriteGenres,
  getStats,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.patch(
  '/me',
  [
    body('name').optional().trim().isLength({ min: 2, max: 60 }),
    body('bio').optional().trim().isLength({ max: 300 }),
    body('avatarUrl').optional().trim().isURL().withMessage('Avatar must be a valid URL.'),
  ],
  validate,
  updateProfile
);

router.patch(
  '/me/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/\d/),
  ],
  validate,
  changePassword
);

router.delete('/me', deleteAccount);
router.get('/me/genres', getFavoriteGenres);
router.put('/me/genres', body('genres').isArray(), validate, setFavoriteGenres);
router.get('/me/stats', getStats);

module.exports = router;
