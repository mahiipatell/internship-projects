const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const listCategories = async () => {
  const result = await query('SELECT * FROM categories ORDER BY name ASC');
  return result.rows;
};

const getCategoryById = async (id) => {
  const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
  if (!result.rows[0]) throw ApiError.notFound('Category not found');
  return result.rows[0];
};

const createCategory = async ({ name, description }) => {
  const result = await query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
    [name, description || null]
  );
  return result.rows[0];
};

const updateCategory = async (id, { name, description }) => {
  const result = await query(
    `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description)
     WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Category not found');
  return result.rows[0];
};

const deleteCategory = async (id) => {
  const inUse = await query('SELECT 1 FROM menu_items WHERE category_id = $1 LIMIT 1', [id]);
  if (inUse.rows[0]) {
    throw ApiError.badRequest('Cannot delete a category that still has menu items assigned to it');
  }
  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (!result.rows[0]) throw ApiError.notFound('Category not found');
};

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
