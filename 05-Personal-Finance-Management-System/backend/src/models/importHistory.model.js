const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = {
  created_at: 'created_at',
  file_name: 'file_name',
  transactions_imported: 'transactions_imported',
};

const ImportHistoryModel = {
  async list(userId, { search, importType, status, sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    const conditions = ['user_id = $1'];
    const params = [userId];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`file_name ILIKE $${params.length}`);
    }
    if (importType) {
      params.push(importType);
      conditions.push(`import_type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const sortColumn = ALLOWED_SORT_COLUMNS[sortBy] || 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const { rows } = await pool.query(
      `SELECT * FROM import_history WHERE ${conditions.join(' AND ')} ORDER BY ${sortColumn} ${order}`,
      params
    );
    return rows;
  },

  async findById(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM import_history WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, record) {
    const {
      fileName,
      importType,
      detectedBank,
      parserUsed,
      totalRows,
      transactionsImported,
      duplicatesSkipped,
      failedRows,
      importDurationMs,
      status,
    } = record;

    const { rows } = await pool.query(
      `INSERT INTO import_history
        (user_id, file_name, import_type, detected_bank, parser_used, total_rows,
         transactions_imported, duplicates_skipped, failed_rows, import_duration_ms, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        fileName,
        importType,
        detectedBank || null,
        parserUsed || null,
        totalRows || 0,
        transactionsImported || 0,
        duplicatesSkipped || 0,
        failedRows || 0,
        importDurationMs || null,
        status || 'success',
      ]
    );
    return rows[0];
  },

  async delete(id, userId) {
    const { rows } = await pool.query(
      'DELETE FROM import_history WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return rows[0];
  },
};

module.exports = ImportHistoryModel;
