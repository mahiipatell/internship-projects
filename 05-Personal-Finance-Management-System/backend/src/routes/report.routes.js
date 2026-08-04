const express = require('express');
const router = express.Router();

const { exportCsv, exportExcel, exportPdf } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/csv', exportCsv);
router.get('/excel', exportExcel);
router.get('/pdf', exportPdf);

module.exports = router;
