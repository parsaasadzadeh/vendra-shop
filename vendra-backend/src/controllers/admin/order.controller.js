const asyncHandler = require("../../utils/asyncHandler");
const orderService = require("../../services/order.service");
const paymentService = require("../../services/payment.service");
const view = require("../../views/order.view");

const list = asyncHandler(async (req, res) => {
  const result = await orderService.listOrdersAdmin(req.query);
  res.json({
    success: true,
    count: result.orders.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    orders: result.orders.map(view.toAdmin),
  });
});

const getOne = asyncHandler(async (req, res) => {
  res.json({ success: true, order: view.toAdmin(await orderService.getOrderAdmin(req.params.id)) });
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  res.json({ success: true, message: "سفارش بروزرسانی شد", order: view.toAdmin(order) });
});

const updatePayment = asyncHandler(async (req, res) => {
  const order = await orderService.markRefunded(req.params.id, req.body);
  res.json({ success: true, message: "وضعیت پرداخت بروزرسانی شد", order: view.toAdmin(order) });
});

const recheckPayment = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderAdmin(req.params.id);
  const result = await paymentService.recheckOrderPayment(order);
  res.json({ success: true, outcome: result.outcome, order: view.toAdmin(result.order) });
});

const releaseExpired = asyncHandler(async (req, res) => {
  res.json({ success: true, released: await orderService.releaseExpiredOrders() });
});

module.exports = { list, getOne, updateStatus, updatePayment, recheckPayment, releaseExpired };
