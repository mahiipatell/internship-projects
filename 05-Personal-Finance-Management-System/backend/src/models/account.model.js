const pool = require('../config/db');

const AccountModel = {
  async list(userId) {
    const { rows } = await pool.query(
      `SELECT id, name, type, icon, is_default
       FROM accounts WHERE user_id = $1
       ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, { name, type, icon }) {
    const { rows } = await pool.query(
      `INSERT INTO accounts (user_id, name, type, icon, is_default)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, name, type, icon, is_default`,
      [userId, name, type, icon || null]
    );
    return rows[0];
  },

  async update(id, userId, { name, type, icon }) {
    const { rows } = await pool.query(
      `UPDATE accounts SET name = $1, type = $2, icon = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, name, type, icon, is_default`,
      [name, type, icon || null, id, userId]
    );
    return rows[0];
  },

  async delete(id, userId) {
    const { rows } = await pool.query(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2 AND is_default = FALSE RETURNING id',
      [id, userId]
    );
    return rows[0];
  },
};

module.exports = AccountModel;
