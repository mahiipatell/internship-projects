const router = require('express').Router();
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { categoryRules } = require('../validators/category.validator');

router.use(authenticate);

router.get('/', categoryController.list);
router.get('/:id', categoryController.getOne);
router.post('/', authorize('admin'), categoryRules, validate, categoryController.create);
router.put('/:id', authorize('admin'), categoryRules, validate, categoryController.update);
router.delete('/:id', authorize('admin'), categoryController.remove);

module.exports = router;
