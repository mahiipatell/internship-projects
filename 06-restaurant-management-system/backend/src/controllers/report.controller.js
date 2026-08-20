const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const reportService = require('../services/report.service');

const sales = asyncHandler(async (req, res) => {
  const { period, from, to } = req.query;
  sendSuccess(res, 200, await reportService.getSalesReport({ period, from, to }));
});
const bestSellers = asyncHandler(async (req, res) => {
  const { from, to, limit } = req.query;
  sendSuccess(res, 200, await reportService.getBestSellingItems({ from, to, limit }));
});
const revenue = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  sendSuccess(res, 200, await reportService.getRevenueSummary({ from, to }));
});

module.exports = { sales, bestSellers, revenue };
