const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const invoiceService = require('../services/invoice.service');

const generate = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.generateInvoice(req.params.billId);
  sendSuccess(res, 201, invoice, 'Invoice generated');
});

const download = asyncHandler(async (req, res) => {
  const filePath = await invoiceService.getInvoiceFilePath(req.params.invoiceNumber);
  res.download(filePath, path.basename(filePath));
});

module.exports = { generate, download };
