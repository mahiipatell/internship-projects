const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const billingService = require('../services/billing.service');

const list = asyncHandler(async (req, res) => {
  const { status, from, to, search } = req.query;
  sendSuccess(res, 200, await billingService.listBills({ status, from, to, search }));
});
const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await billingService.getBillById(req.params.id));
});
const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body, cashier_id: req.user.id };
  sendSuccess(res, 201, await billingService.createBill(payload), 'Bill generated');
});
const recordPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await billingService.recordPayment(req.params.id, req.body), 'Payment recorded');
});

module.exports = { list, getOne, create, recordPayment };
