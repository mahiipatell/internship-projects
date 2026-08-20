const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createUserRules, updateUserRules, changePasswordRules } = require('../validators/user.validator');

// Self-service: any authenticated user may change their OWN password.
// Registered before the admin lock below so it isn't caught by authorize('admin').
router.put('/me/password', authenticate, changePasswordRules, validate, userController.changeOwnPassword);

router.use(authenticate, authorize('admin'));

router.get('/', userController.list);
router.get('/:id', userController.getOne);
router.post('/', createUserRules, validate, userController.create);
router.put('/:id', updateUserRules, validate, userController.update);
router.put('/:id/password', changePasswordRules, validate, userController.changePassword);
router.delete('/:id', userController.remove);

module.exports = router;
