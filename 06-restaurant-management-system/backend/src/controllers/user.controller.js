const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const userService = require('../services/user.service');

const list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers({ role: req.query.role });
  sendSuccess(res, 200, users);
});

const getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, 200, user);
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, 201, user, 'User created');
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendSuccess(res, 200, user, 'User updated');
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.params.id, req.body.newPassword);
  sendSuccess(res, 200, null, 'Password updated');
});

// Self-service password change: always targets the authenticated caller's
// own account (req.user.id), never a param, so a user can never change
// someone else's password through this endpoint.
const changeOwnPassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body.newPassword);
  sendSuccess(res, 200, null, 'Password updated');
});

const remove = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendSuccess(res, 200, null, 'User deleted');
});

module.exports = { list, getOne, create, update, changePassword, changeOwnPassword, remove };
