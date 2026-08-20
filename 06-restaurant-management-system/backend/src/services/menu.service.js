const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const listMenuItems = async ({ search, categoryId, available } = {}) => {
  const clauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    clauses.push(`m.name ILIKE $${params.length}`);
  }
  if (categoryId) {
    params.push(categoryId);
    clauses.push(`m.category_id = $${params.length}`);
  }
  if (available !== undefined) {
    params.push(available);
    clauses.push(`m.is_available = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await query(
    `SELECT m.*, c.name AS category_name
     FROM menu_items m
     JOIN categories c ON c.id = m.category_id
     ${where}
     ORDER BY m.name ASC`,
    params
  );
  return result.rows;
};

const getMenuItemById = async (id) => {
  const result = await query(
    `SELECT m.*, c.name AS category_name FROM menu_items m
     JOIN categories c ON c.id = m.category_id WHERE m.id = $1`,
    [id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Menu item not found');
  return result.rows[0];
};

const createMenuItem = async ({ category_id, name, description, price, is_available, image_url }) => {
  const result = await query(
    `INSERT INTO menu_items (category_id, name, description, price, is_available, image_url)
     VALUES ($1, $2, $3, $4, COALESCE($5, TRUE), $6) RETURNING *`,
    [category_id, name, description || null, price, is_available, image_url || null]
  );
  return result.rows[0];
};

const updateMenuItem = async (id, { category_id, name, description, price, is_available, image_url }) => {
  const result = await query(
    `UPDATE menu_items SET
       category_id = COALESCE($1, category_id),
       name = COALESCE($2, name),
       description = COALESCE($3, description),
       price = COALESCE($4, price),
       is_available = COALESCE($5, is_available),
       image_url = COALESCE($6, image_url)
     WHERE id = $7 RETURNING *`,
    [category_id, name, description, price, is_available, image_url, id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Menu item not found');
  return result.rows[0];
};

const deleteMenuItem = async (id) => {
  const inUse = await query('SELECT 1 FROM order_items WHERE menu_item_id = $1 LIMIT 1', [id]);
  if (inUse.rows[0]) {
    throw ApiError.badRequest('Cannot delete a menu item that appears in existing orders. Mark it unavailable instead.');
  }
  const result = await query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
  if (!result.rows[0]) throw ApiError.notFound('Menu item not found');
};

module.exports = { listMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem };
