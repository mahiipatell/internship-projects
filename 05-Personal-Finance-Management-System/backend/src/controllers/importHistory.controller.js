const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ImportHistoryModel = require('../models/importHistory.model');

const getHistory = asyncHandler(async (req, res) => {
  const { search, importType, status, sortBy, sortOrder } = req.query;
  const records = await ImportHistoryModel.list(req.user.id, {
    search,
    importType,
    status,
    sortBy,
    sortOrder,
  });
  res.json({ success: true, data: { records } });
});

const getHistoryRecord = asyncHandler(async (req, res) => {
  const record = await ImportHistoryModel.findById(req.params.id, req.user.id);
  if (!record) throw new ApiError(404, 'Import history record not found');
  res.json({ success: true, data: { record } });
});

// Called by the frontend right after a bulk import finishes — keeps the
// existing bulkImportTransactions endpoint untouched, since this is purely
// additive record-keeping around it.
const createHistoryRecord = asyncHandler(async (req, res) => {
  const { fileName, importType } = req.body;
  if (!fileName || !importType) {
    throw new ApiError(422, 'fileName and importType are required');
  }
  const record = await ImportHistoryModel.create(req.user.id, req.body);
  res.status(201).json({ success: true, data: { record } });
});

const deleteHistoryRecord = asyncHandler(async (req, res) => {
  const deleted = await ImportHistoryModel.delete(req.params.id, req.user.id);
  if (!deleted) throw new ApiError(404, 'Import history record not found');
  res.json({ success: true, message: 'Import history record deleted' });
});

module.exports = { getHistory, getHistoryRecord, createHistoryRecord, deleteHistoryRecord };
