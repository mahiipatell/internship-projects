const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const AccountModel = require('../models/account.model');

const ACCOUNT_TYPES = ['cash', 'bank', 'credit_card', 'wallet'];

const getAccounts = asyncHandler(async (req, res) => {
  const accounts = await AccountModel.list(req.user.id);
  res.json({ success: true, data: { accounts } });
});

const createAccount = asyncHandler(async (req, res) => {
  const { name, type, icon } = req.body;
  if (!name || !name.trim() || !ACCOUNT_TYPES.includes(type)) {
    throw new ApiError(422, 'A valid account name and type (cash, bank, credit_card, wallet) are required');
  }
  const account = await AccountModel.create(req.user.id, { name: name.trim(), type, icon });
  res.status(201).json({ success: true, data: { account } });
});

const updateAccount = asyncHandler(async (req, res) => {
  const { name, type, icon } = req.body;
  if (!name || !name.trim() || !ACCOUNT_TYPES.includes(type)) {
    throw new ApiError(422, 'A valid account name and type are required');
  }
  const account = await AccountModel.update(req.params.id, req.user.id, { name: name.trim(), type, icon });
  if (!account) throw new ApiError(404, 'Account not found');
  res.json({ success: true, data: { account } });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const deleted = await AccountModel.delete(req.params.id, req.user.id);
  if (!deleted) throw new ApiError(404, 'Account not found, or it is your default account and cannot be deleted');
  res.json({ success: true, message: 'Account deleted' });
});

module.exports = { getAccounts, createAccount, updateAccount, deleteAccount };
