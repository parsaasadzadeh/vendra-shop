const asyncHandler = require("../utils/asyncHandler");
const orderService = require("../services/order.service");
const view = require("../views/order.view");

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  res.status(201).json({
    success: true,
    message: "سفارش ثبت شد؛ برای تکمیل خرید پرداخت را انجام دهید",
    order: view.toPublic(order, { includeToken: true }),
  });
});

const track = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderByToken(req.params.token);
  res.json({ success: true, order: view.toPublic(order) });
});

const lookup = asyncHandler(async (req, res) => {
  const order = await orderService.lookupOrder(req.body);
  res.json({ success: true, order: view.toPublic(order) });
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrderByToken(req.params.token);
  res.json({ success: true, message: "سفارش لغو شد", order: view.toPublic(order) });
});

module.exports = { create, track, lookup, cancel };
