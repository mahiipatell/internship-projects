const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const CategoryModel = require('../models/category.model');

const getCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const categories = await CategoryModel.findAllForUser(req.user.id, type);
  res.json({ success: true, data: { categories } });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon } = req.body;

  if (!name || !type || !['income', 'expense'].includes(type)) {
    throw new ApiError(422, 'A category name and a valid type (income/expense) are required');
  }

  const existing = await CategoryModel.findByName(req.user.id, name.trim());
  if (existing) {
    throw new ApiError(409, 'A category with this name already exists');
  }

  const category = await CategoryModel.create(req.user.id, { name: name.trim(), type, icon });
  res.status(201).json({ success: true, data: { category } });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const deleted = await CategoryModel.delete(req.params.id, req.user.id);
  if (!deleted) {
    throw new ApiError(404, 'Category not found, or it is a default category that cannot be deleted');
  }
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, deleteCategory };
