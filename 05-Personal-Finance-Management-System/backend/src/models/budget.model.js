const pool = require('../config/db');

const BudgetModel = {
  async getSettings(userId) {
    const { rows } = await pool.query('SELECT * FROM budget_settings WHERE user_id = $1', [
      userId,
    ]);
    return rows[0];
  },

  async getCategories(budgetSettingsId) {
    const { rows } = await pool.query(
      `SELECT bc.id, bc.allocated_amount, bc.category_id,
              c.name AS category_name, c.icon AS category_icon
       FROM budget_categories bc
       JOIN categories c ON c.id = bc.category_id
       WHERE bc.budget_settings_id = $1
       ORDER BY bc.created_at ASC`,
      [budgetSettingsId]
    );
    return rows;
  },

  // Creates the budget_settings row (income + savings goal) the first time
  // a user turns the plan on, or updates it if they already have one.
  // Deliberately does NOT touch budget_categories — allocations are
  // managed independently via addAllocation/updateAllocation/deleteAllocation.
  async enable(userId, { monthlyIncome, savingsGoal }) {
    const { rows } = await pool.query(
      `INSERT INTO budget_settings (user_id, is_enabled, monthly_income, savings_goal)
       VALUES ($1, TRUE, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET is_enabled = TRUE, monthly_income = $2, savings_goal = $3
       RETURNING *`,
      [userId, monthlyIncome, savingsGoal]
    );
    return rows[0];
  },

  async setEnabled(userId, isEnabled) {
    const { rows } = await pool.query(
      `UPDATE budget_settings SET is_enabled = $1 WHERE user_id = $2 RETURNING *`,
      [isEnabled, userId]
    );
    return rows[0];
  },

  async addAllocation(budgetSettingsId, categoryId, amount) {
    const { rows } = await pool.query(
      `INSERT INTO budget_categories (budget_settings_id, category_id, allocated_amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (budget_settings_id, category_id)
       DO UPDATE SET allocated_amount = $3
       RETURNING id, allocated_amount, category_id`,
      [budgetSettingsId, categoryId, amount]
    );
    return rows[0];
  },

  async findAllocationOwnedByUser(allocationId, userId) {
    const { rows } = await pool.query(
      `SELECT bc.id, bc.allocated_amount, bc.category_id, bc.budget_settings_id
       FROM budget_categories bc
       JOIN budget_settings bs ON bs.id = bc.budget_settings_id
       WHERE bc.id = $1 AND bs.user_id = $2`,
      [allocationId, userId]
    );
    return rows[0];
  },

  async updateAllocationAmount(allocationId, amount) {
    const { rows } = await pool.query(
      `UPDATE budget_categories SET allocated_amount = $1 WHERE id = $2 RETURNING *`,
      [amount, allocationId]
    );
    return rows[0];
  },

  async deleteAllocation(allocationId) {
    const { rows } = await pool.query(
      'DELETE FROM budget_categories WHERE id = $1 RETURNING id',
      [allocationId]
    );
    return rows[0];
  },

  async reset(userId) {
    const settings = await this.getSettings(userId);
    if (!settings) return null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM budget_categories WHERE budget_settings_id = $1', [
        settings.id,
      ]);
      await client.query(
        `UPDATE budget_settings
         SET is_enabled = FALSE, monthly_income = 0, savings_goal = 0
         WHERE id = $1`,
        [settings.id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return true;
  },

  async getSpentByCategoryThisMonth(userId) {
    const { rows } = await pool.query(
      `SELECT category_id, COALESCE(SUM(amount), 0)::float AS spent
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
       GROUP BY category_id`,
      [userId]
    );
    return rows;
  },
};

module.exports = BudgetModel;
