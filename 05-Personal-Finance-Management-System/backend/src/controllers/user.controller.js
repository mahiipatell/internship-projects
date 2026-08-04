const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/user.model');

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const taken = await UserModel.emailTakenByOther(email, req.user.id);
  if (taken) {
    throw new ApiError(409, 'This email is already in use by another account');
  }

  const user = await UserModel.updateProfile(req.user.id, { name, email });
  res.json({ success: true, data: { user } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const fullUser = await UserModel.findByEmail(req.user.email);
  const isMatch = await bcrypt.compare(currentPassword, fullUser.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePassword(req.user.id, newHash);

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { updateProfile, changePassword };
