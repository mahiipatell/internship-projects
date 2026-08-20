const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const orderService = require('../services/order.service');

const list = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  sendSuccess(res, 200, await orderService.listOrders({ status, date }));
});
const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await orderService.getOrderById(req.params.id));
});
const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body, waiter_id: req.user.id };
  sendSuccess(res, 201, await orderService.createOrder(payload), 'Order created');
});
const updateItems = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await orderService.updateOrderItems(req.params.id, req.body.items), 'Order items updated');
});
const updateStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, await orderService.updateOrderStatus(req.params.id, req.body.status), 'Order status updated');
});
const remove = asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  sendSuccess(res, 200, null, 'Order deleted');
});

module.exports = { list, getOne, create, updateItems, updateStatus, remove };
