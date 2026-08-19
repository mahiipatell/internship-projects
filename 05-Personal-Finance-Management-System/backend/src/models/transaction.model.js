const pool = require('../config/db');

/**
 * Builds the shared WHERE clause + params used by both the list query and
 * the count query, so filtering logic only lives in one place.
 */
function buildFilters({ userId, search, type, categoryId, from, to }) {
  const conditions = ['t.user_id = $1'];
  const params = [userId];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`t.title ILIKE $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`t.type = $${params.length}`);
  }
  if (categoryId) {
    params.push(categoryId);
    conditions.push(`t.category_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`t.transaction_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`t.transaction_date <= $${params.length}`);
  }

  return { whereClause: conditions.join(' AND '), params };
}

const ALLOWED_SORT_COLUMNS = {
  date: 't.transaction_date',
  amount: 't.amount',
  title: 't.title',
  created_at: 't.created_at',
};

const TransactionModel = {
  async list({
    userId,
    search,
    type,
    categoryId,
    from,
    to,
    sortBy = 'date',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  }) {
    const { whereClause, params } = buildFilters({ userId, search, type, categoryId, from, to });
    const sortColumn = ALLOWED_SORT_COLUMNS[sortBy] || 't.transaction_date';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT t.id, t.title, t.amount, t.type, t.transaction_date AS date, t.notes, t.created_at,
             c.id AS category_id, c.name AS category_name, c.icon AS category_icon,
             a.id AS account_id, a.name AS account_name
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN accounts a ON a.id = t.account_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${order}, t.id DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;

    const countQuery = `SELECT COUNT(*)::int AS count FROM transactions t WHERE ${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, params),
    ]);

    return {
      transactions: dataResult.rows,
      total: countResult.rows[0].count,
    };
  },

  async findById(id, userId) {
    const { rows } = await pool.query(
      `SELECT t.*, t.transaction_date AS date, c.name AS category_name, c.icon AS category_icon,
              a.name AS account_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN accounts a ON a.id = t.account_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, { title, amount, type, categoryId, date, notes, accountId }) {
    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, category_id, account_id, title, amount, type, transaction_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *, transaction_date AS date`,
      [userId, categoryId, accountId || null, title, amount, type, date, notes || null]
    );
    return rows[0];
  },

  // Lightweight existence check used by CSV import duplicate detection —
  // matches on the same fields a human would eyeball (date, amount,
  // exact title) rather than a fuzzy comparison.
  async existsSimilar(userId, { title, amount, date }) {
    const { rows } = await pool.query(
      `SELECT id FROM transactions
       WHERE user_id = $1 AND transaction_date = $2 AND amount = $3 AND title ILIKE $4
       LIMIT 1`,
      [userId, date, amount, title]
    );
    return rows.length > 0;
  },

  async update(id, userId, { title, amount, type, categoryId, date, notes, accountId }) {
    const { rows } = await pool.query(
      `UPDATE transactions
       SET title = $1, amount = $2, type = $3, category_id = $4, transaction_date = $5, notes = $6, account_id = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *, transaction_date AS date`,
      [title, amount, type, categoryId, date, notes || null, accountId || null, id, userId]
    );
    return rows[0];
  },

  async delete(id, userId) {
    const { rows } = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return rows[0];
  },

  async getSummary(userId, { from, to } = {}) {
    const { whereClause, params } = buildFilters({ userId, from, to });
    const { rows } = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0)::float AS total
       FROM transactions t
       WHERE ${whereClause}
       GROUP BY type`,
      params
    );

    const summary = { income: 0, expense: 0 };
    rows.forEach((row) => {
      summary[row.type] = row.total;
    });

    return {
      income: summary.income,
      expense: summary.expense,
      balance: summary.income - summary.expense,
    };
  },

  async getMonthlyBreakdown(userId, months = 6) {
    const { rows } = await pool.query(
      `SELECT to_char(date_trunc('month', transaction_date), 'YYYY-MM') AS month,
              type,
              COALESCE(SUM(amount), 0)::float AS total
       FROM transactions
       WHERE user_id = $1
         AND transaction_date >= date_trunc('month', CURRENT_DATE) - ($2 || ' months')::interval
       GROUP BY month, type
       ORDER BY month ASC`,
      [userId, months - 1]
    );
    return rows;
  },

  async getCategoryBreakdown(userId, { from, to, type = 'expense', limit } = {}) {
    const { whereClause, params } = buildFilters({ userId, from, to, type });
    let query = `
      SELECT c.name AS category, COALESCE(SUM(t.amount), 0)::float AS total
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE ${whereClause}
      GROUP BY c.name
      ORDER BY total DESC
    `;
    if (limit) {
      query += ` LIMIT ${Number(limit)}`;
    }
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async listAllForExport(userId, { from, to } = {}) {
    const { whereClause, params } = buildFilters({ userId, from, to });
    const { rows } = await pool.query(
      `SELECT t.title, t.amount, t.type, t.transaction_date AS date, t.notes, c.name AS category
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY t.transaction_date DESC`,
      params
    );
    return rows;
  },

  async getTopMerchant(userId, { from, to } = {}) {
    const { whereClause, params } = buildFilters({ userId, from, to, type: 'expense' });
    const { rows } = await pool.query(
      `SELECT t.title, COUNT(*)::int AS visits
       FROM transactions t
       WHERE ${whereClause}
       GROUP BY t.title
       ORDER BY visits DESC, t.title ASC
       LIMIT 1`,
      params
    );
    return rows[0];
  },

  async getHighestExpense(userId, { from, to } = {}) {
    const { whereClause, params } = buildFilters({ userId, from, to, type: 'expense' });
    const { rows } = await pool.query(
      `SELECT t.title, t.amount, t.transaction_date AS date, c.name AS category_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY t.amount DESC
       LIMIT 1`,
      params
    );
    return rows[0];
  },
};

module.exports = TransactionModel;
