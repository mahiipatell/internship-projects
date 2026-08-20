const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const menuService = require('../services/menu.service');

const list = asyncHandler(async (req, res) => {
  const { search, categoryId, available } = req.query;
  const filters = {
    search,
    categoryId,
    available: available === undefined ? undefined : available === 'true',
  };
  sendSuccess(res, 200, await menuService.listMenuItems(filters));
});
const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await menuService.getMenuItemById(req.params.id));
});
const create = asyncHandler(async (req, res) => {
  sendSuccess(res, 201, await menuService.createMenuItem(req.body), 'Menu item created');
});
const update = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await menuService.updateMenuItem(req.params.id, req.body), 'Menu item updated');
});
const remove = asyncHandler(async (req, res) => {
  await menuService.deleteMenuItem(req.params.id);
  sendSuccess(res, 200, null, 'Menu item deleted');
});

module.exports = { list, getOne, create, update, remove };
