const router = require('express').Router();
const tableController = require('../controllers/table.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { tableRules } = require('../validators/table.validator');

router.use(authenticate);

router.get('/', tableController.list);
router.get('/:id', tableController.getOne);
router.post('/', authorize('admin'), tableRules, validate, tableController.create);
router.put('/:id', authorize('admin'), tableRules, validate, tableController.update);
router.delete('/:id', authorize('admin'), tableController.remove);

module.exports = router;
