const pool = require('../config/db');

const SavingsGoalModel = {
  async list(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, { name, icon, targetAmount, targetDate }) {
    const { rows } = await pool.query(
      `INSERT INTO savings_goals (user_id, name, icon, target_amount, target_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, icon || null, targetAmount, targetDate || null]
    );
    return rows[0];
  },

  async update(id, userId, { name, icon, targetAmount, targetDate }) {
    const { rows } = await pool.query(
      `UPDATE savings_goals
       SET name = $1, icon = $2, target_amount = $3, target_date = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, icon || null, targetAmount, targetDate || null, id, userId]
    );
    return rows[0];
  },

  async addContribution(id, userId, amount) {
    const { rows } = await pool.query(
      `UPDATE savings_goals
       SET current_amount = current_amount + $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [amount, id, userId]
    );
    return rows[0];
  },

  async delete(id, userId) {
    const { rows } = await pool.query(
      'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return rows[0];
  },
};

module.exports = SavingsGoalModel;
