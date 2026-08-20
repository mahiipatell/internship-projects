const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const userService = require('./user.service');

const login = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await userService.verifyPassword(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ id: user.id, role: user.role });
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
};

module.exports = { login };
