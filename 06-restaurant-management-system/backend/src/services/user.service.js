const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const SAFE_COLUMNS = 'id, name, email, role, phone, is_active, created_at, updated_at';

const getUserById = async (id) => {
  const result = await query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const getUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const listUsers = async ({ role } = {}) => {
  const clauses = [];
  const params = [];
  if (role) {
    params.push(role);
    clauses.push(`role = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await query(
    `SELECT ${SAFE_COLUMNS} FROM users ${where} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const createUser = async ({ name, email, password, role, phone }) => {
  const existing = await getUserByEmail(email);
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_COLUMNS}`,
    [name, email, passwordHash, role, phone || null]
  );
  return result.rows[0];
};

const updateUser = async (id, { name, phone, role, is_active }) => {
  const result = await query(
    `UPDATE users SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone),
       role = COALESCE($3, role),
       is_active = COALESCE($4, is_active)
     WHERE id = $5
     RETURNING ${SAFE_COLUMNS}`,
    [name, phone, role, is_active, id]
  );
  if (!result.rows[0]) throw ApiError.notFound('User not found');
  return result.rows[0];
};

const changePassword = async (id, newPassword) => {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
};

const deleteUser = async (id) => {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (!result.rows[0]) throw ApiError.notFound('User not found');
};

const verifyPassword = async (plain, hash) => bcrypt.compare(plain, hash);

module.exports = {
  getUserById,
  getUserByEmail,
  listUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  verifyPassword,
};
