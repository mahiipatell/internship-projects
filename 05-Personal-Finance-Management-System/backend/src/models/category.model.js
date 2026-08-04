const pool = require('../config/db');

const CategoryModel = {
  async findAllForUser(userId, type) {
    const params = [userId];
    let query = `SELECT id, user_id, name, type, icon, is_default
                 FROM categories
                 WHERE (user_id = $1 OR user_id IS NULL)`;

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    query += ' ORDER BY is_default DESC, name ASC';

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return rows[0];
  },

  async create(userId, { name, type, icon }) {
    const { rows } = await pool.query(
      `INSERT INTO categories (user_id, name, type, icon, is_default)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, user_id, name, type, icon, is_default`,
      [userId, name, type, icon || null]
    );
    return rows[0];
  },

  async delete(id, userId) {
    const { rows } = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = FALSE RETURNING id',
      [id, userId]
    );
    return rows[0];
  },

  async findByName(userId, name) {
    const { rows } = await pool.query(
      `SELECT * FROM categories
       WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)
       ORDER BY user_id NULLS LAST LIMIT 1`,
      [name, userId]
    );
    return rows[0];
  },

  // Case-insensitive match, used when auto-creating a category for a new
  // financial-plan allocation so "Gym" and "gym" don't create duplicates.
  async findByNameCaseInsensitive(userId, name) {
    const { rows } = await pool.query(
      `SELECT * FROM categories
       WHERE name ILIKE $1 AND (user_id = $2 OR user_id IS NULL)
       ORDER BY user_id NULLS LAST LIMIT 1`,
      [name, userId]
    );
    return rows[0];
  },

  async updateNameIcon(id, userId, { name, icon }) {
    const { rows } = await pool.query(
      `UPDATE categories SET name = $1, icon = $2
       WHERE id = $3 AND user_id = $4 AND is_default = FALSE
       RETURNING id, user_id, name, type, icon, is_default`,
      [name, icon || null, id, userId]
    );
    return rows[0];
  },

  // Shared helper: finds an existing category the user can use (case-
  // insensitive), or creates a new custom one. Used by budget allocations
  // and by CSV import auto-categorization so both stay in sync.
  async findOrCreate(userId, name, type, icon) {
    const trimmedName = name.trim();
    const existing = await this.findByNameCaseInsensitive(userId, trimmedName);
    if (existing) return existing;
    return this.create(userId, { name: trimmedName, type, icon });
  },
};

module.exports = CategoryModel;
