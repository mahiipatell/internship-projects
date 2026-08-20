const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const listTables = async ({ status } = {}) => {
  const clauses = [];
  const params = [];

  if (status) {
    params.push(status);
    clauses.push(`status = $${params.length}::table_status`);
  }

  const where = clauses.length
    ? `WHERE ${clauses.join(' AND ')}`
    : '';

  const result = await query(
    `SELECT *
     FROM restaurant_tables
     ${where}
     ORDER BY table_number ASC`,
    params
  );

  return result.rows;
};

const getTableById = async (id) => {
  const result = await query(
    'SELECT * FROM restaurant_tables WHERE id = $1',
    [id]
  );

  if (!result.rows[0]) {
    throw ApiError.notFound('Table not found');
  }

  return result.rows[0];
};

const createTable = async ({
  table_number,
  capacity,
  status = 'available',
}) => {
  const result = await query(
    `INSERT INTO restaurant_tables (
      table_number,
      capacity,
      status
    )
    VALUES (
      $1,
      $2,
      $3::table_status
    )
    RETURNING *`,
    [
      table_number,
      capacity,
      status,
    ]
  );

  return result.rows[0];
};

const updateTable = async (
  id,
  {
    table_number,
    capacity,
    status,
  }
) => {
  const result = await query(
    `UPDATE restaurant_tables
     SET
       table_number = COALESCE($1, table_number),
       capacity = COALESCE($2, capacity),
       status = COALESCE($3::table_status, status)
     WHERE id = $4
     RETURNING *`,
    [
      table_number,
      capacity,
      status,
      id,
    ]
  );

  if (!result.rows[0]) {
    throw ApiError.notFound('Table not found');
  }

  return result.rows[0];
};

const deleteTable = async (id) => {
  const inUse = await query(
    'SELECT 1 FROM orders WHERE table_id = $1 LIMIT 1',
    [id]
  );

  if (inUse.rows[0]) {
    throw ApiError.badRequest(
      'Cannot delete a table that has existing orders associated with it.'
    );
  }

  const result = await query(
    'DELETE FROM restaurant_tables WHERE id = $1 RETURNING id',
    [id]
  );

  if (!result.rows[0]) {
    throw ApiError.notFound('Table not found');
  }
};

module.exports = {
  listTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
};