const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

const summary = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await dashboardService.getDashboardSummary());
});

module.exports = { summary };
