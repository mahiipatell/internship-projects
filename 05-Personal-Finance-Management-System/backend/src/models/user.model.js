const pool = require('../config/db');

const UserModel = {
  async create({ name, email, passwordHash }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  },

  async updateProfile(id, { name, email }) {
    const { rows } = await pool.query(
      `UPDATE users SET name = $1, email = $2
       WHERE id = $3
       RETURNING id, name, email, created_at`,
      [name, email, id]
    );
    return rows[0];
  },

  async updatePassword(id, passwordHash) {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },

  async emailTakenByOther(email, excludeId) {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, excludeId]
    );
    return rows.length > 0;
  },
};

module.exports = UserModel;
