const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const paymentService = require("../services/payment.service");

const request = asyncHandler(async (req, res) => {
  const token = req.body && req.body.trackingToken;
  if (typeof token !== "string") throw new AppError("کد سفارش ارسال نشده است", 400);

  const result = await paymentService.requestPayment(token);
  res.json({ success: true, ...result });
});

// زیبال کاربر را به این آدرس برمی‌گرداند؛ ما پرداخت را از خود زیبال تایید می‌کنیم و کاربر را به فرانت می‌فرستیم
const zibalCallback = asyncHandler(async (req, res) => {
  const front = (process.env.FRONT_URL || "http://localhost:3000").replace(/\/$/, "");
  const go = (path, params) => res.redirect(`${front}${path}?${new URLSearchParams(params).toString()}`);

  try {
    const result = await paymentService.handleZibalCallback(req.query);
    const params = result.order ? { order: result.order.orderNumber, token: result.order.trackingToken } : {};

    if (result.ok) return go("/payment/success", params);
    return go("/payment/failed", { ...params, reason: result.reason });
  } catch (err) {
    console.error("Zibal callback error:", err);
    return go("/payment/failed", { reason: "server_error" });
  }
});

module.exports = { request, zibalCallback };
