const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const categoryService = require('../services/category.service');

const list = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await categoryService.listCategories());
});
const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await categoryService.getCategoryById(req.params.id));
});
const create = asyncHandler(async (req, res) => {
  sendSuccess(res, 201, await categoryService.createCategory(req.body), 'Category created');
});
const update = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await categoryService.updateCategory(req.params.id, req.body), 'Category updated');
});
const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, 200, null, 'Category deleted');
});

module.exports = { list, getOne, create, update, remove };
