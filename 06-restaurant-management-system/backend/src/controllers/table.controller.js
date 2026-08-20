const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const tableService = require('../services/table.service');

const list = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await tableService.listTables({ status: req.query.status }));
});
const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await tableService.getTableById(req.params.id));
});
const create = asyncHandler(async (req, res) => {
  sendSuccess(res, 201, await tableService.createTable(req.body), 'Table created');
});
const update = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await tableService.updateTable(req.params.id, req.body), 'Table updated');
});
const remove = asyncHandler(async (req, res) => {
  await tableService.deleteTable(req.params.id);
  sendSuccess(res, 200, null, 'Table deleted');
});

module.exports = { list, getOne, create, update, remove };
