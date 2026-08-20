const router = require('express').Router();
const menuController = require('../controllers/menu.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { menuItemRules } = require('../validators/menu.validator');

router.use(authenticate);

router.get('/', menuController.list);
router.get('/:id', menuController.getOne);
router.post('/', authorize('admin'), menuItemRules, validate, menuController.create);
router.put('/:id', authorize('admin'), menuItemRules, validate, menuController.update);
router.delete('/:id', authorize('admin'), menuController.remove);

module.exports = router;
