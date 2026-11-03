const Order = require("../models/order.model");
const AppError = require("../utils/appError");
const { zibalRequest, zibalVerify, isTestMode } = require("./zibal.service");
const { getOrderByToken, reviveIfPaidAfterExpiry } = require("./order.service");

// قیمت‌ها تومان هستند؛ زیبال ریال می‌خواهد
const toRial = (order) => Math.round(Number(order.totalPrice || 0)) * 10;

/* ------------------------------------------------------------------ */
/* شروع پرداخت                                                          */
/* ------------------------------------------------------------------ */

const requestPayment = async (token) => {
  const order = await getOrderByToken(token);

  if (order.paymentStatus === "paid") throw new AppError("این سفارش قبلاً پرداخت شده است", 400);
  if (order.orderStatus === "cancelled") throw new AppError("این سفارش لغو یا منقضی شده است؛ سفارش جدید ثبت کنید", 400);
  if (order.paymentStatus === "refunded") throw new AppError("این سفارش قابل پرداخت نیست", 400);

  const { trackId, paymentUrl } = await zibalRequest({
    amountRial: toRial(order),
    description: `Order ${order.orderNumber}`,
    mobile: order.customer.phone,
    orderId: order.orderNumber,
  });

  // همه‌ی trackIdها نگه داشته می‌شوند تا اگر مشتری چند بار شروع کرد و با تراکنش قبلی پرداخت کرد، callback گم نشود.
  // اگر در این فاصله سفارش لغو/پرداخت شده، لینک پرداخت به مشتری داده نمی‌شود.
  const saved = await Order.updateOne(
    { _id: order._id, paymentStatus: { $in: ["pending", "failed"] }, orderStatus: { $ne: "cancelled" } },
    {
      $set: { "paymentGateway.name": "zibal", "paymentGateway.trackId": trackId },
      $addToSet: { "paymentGateway.trackIds": trackId },
    }
  );
  if (saved.matchedCount !== 1) {
    throw new AppError("وضعیت سفارش تغییر کرده است؛ دوباره تلاش کنید", 409);
  }

  return { trackId, paymentUrl, testMode: isTestMode() };
};

/* ------------------------------------------------------------------ */
/* تایید پرداخت                                                         */
/* ------------------------------------------------------------------ */

// تایید واقعی از خود زیبال (به query string اعتماد نمی‌کنیم) و ثبت «پرداخت‌شده» به‌صورت atomic
// outcome: paid | already_paid | not_paid | amount_mismatch | refund_pending
const settlePayment = async (order, trackId) => {
  const { ok, data } = await zibalVerify({ trackId });
  if (!ok) return { outcome: "not_paid", order };

  // مبلغ پرداخت‌شده باید با مبلغ سفارش برابر باشد
  if (data.amount !== undefined && Number(data.amount) !== toRial(order)) {
    console.error(
      `Zibal amount mismatch: order ${order.orderNumber}, expected ${toRial(order)}, got ${data.amount}, trackId ${trackId}`
    );
    const flagged = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "failed", refundRequired: true } },
      { new: true }
    );
    return { outcome: "amount_mismatch", order: flagged || order };
  }

  // اگر callback دوبار بیاید فقط یک‌بار اعمال می‌شود
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: "paid" } },
    {
      $set: {
        paymentStatus: "paid",
        paidAt: new Date(),
        "paymentGateway.refNumber": String(data.refNumber || ""),
        "paymentGateway.paidTrackId": trackId,
      },
    },
    { new: true }
  );
  if (!updated) return { outcome: "already_paid", order: await Order.findById(order._id) };

  const final = await reviveIfPaidAfterExpiry(updated);
  // پول گرفته شده ولی سفارش فعال نشد (مثلاً موجودی تمام شده)؛ به مشتری صادقانه می‌گوییم
  if (final && final.orderStatus === "cancelled") return { outcome: "refund_pending", order: final };
  return { outcome: "paid", order: final };
};

const markFailed = (orderId) =>
  Order.updateOne({ _id: orderId, paymentStatus: { $ne: "paid" } }, { $set: { paymentStatus: "failed" } });

// خروجی: { ok, reason?, order? } ؛ کنترلر آن را به ریدایرکت تبدیل می‌کند
const handleZibalCallback = async (query = {}) => {
  const trackId = typeof query.trackId === "string" ? query.trackId : "";
  if (!/^\d+$/.test(trackId)) return { ok: false, reason: "no_trackId" };

  const order = await Order.findOne({ "paymentGateway.trackIds": trackId });
  if (!order) return { ok: false, reason: "order_not_found" };

  if (order.paymentStatus === "paid") {
    // پرداخت دوباره با تراکنشِ دیگر برای سفارشِ از قبل پرداخت‌شده: بعد از تایید واقعی، علامت برگشت وجه می‌خورد
    const paidWith = order.paymentGateway && order.paymentGateway.paidTrackId;
    if (query.success === "1" && paidWith && paidWith !== trackId) {
      const { ok } = await zibalVerify({ trackId });
      if (ok) {
        console.error(`Duplicate payment: order ${order.orderNumber}, paid with ${paidWith}, again with ${trackId} — refund needed`);
        await Order.updateOne({ _id: order._id }, { $set: { refundRequired: true } });
      }
    }
    return { ok: true, order };
  }

  if (query.success !== "1") {
    await markFailed(order._id);
    return { ok: false, reason: "cancelled", order };
  }

  const result = await settlePayment(order, trackId);
  switch (result.outcome) {
    case "paid":
    case "already_paid":
      return { ok: true, order: result.order };
    case "refund_pending":
      return { ok: false, reason: "refund_pending", order: result.order };
    case "amount_mismatch":
      return { ok: false, reason: "amount_mismatch", order: result.order };
    default:
      await markFailed(order._id);
      return { ok: false, reason: "verify_failed", order };
  }
};

// ادمین: اگر مشتری می‌گوید پول رفته ولی سفارش پرداخت‌شده نشده، همه‌ی تراکنش‌ها دوباره از زیبال استعلام می‌شوند
const recheckOrderPayment = async (order) => {
  if (order.paymentStatus === "paid") return { outcome: "already_paid", order };

  for (const trackId of order.paymentGateway?.trackIds || []) {
    const result = await settlePayment(order, trackId);
    if (result.outcome !== "not_paid") return result;
  }
  return { outcome: "not_paid", order };
};

module.exports = { requestPayment, handleZibalCallback, recheckOrderPayment };
