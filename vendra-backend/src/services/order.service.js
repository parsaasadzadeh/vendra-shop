const Order = require("../models/order.model");
const AppError = require("../utils/appError");
const settings = require("../config/settings");
const { validateCheckoutInfo } = require("../validators/checkout.validator");
const { resolveCart } = require("./cart.service");
const { reserveItems, restoreItems } = require("./stock.service");
const { generateOrderNumber, generateTrackingToken } = require("../utils/tokens");
const { isMongoId, normalizePhone, isValidIranPhone, escapeRegex } = require("../utils/validators");
const { getPagination, buildMeta } = require("../utils/pagination");
const {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_TRANSITIONS,
  ADMIN_PAYMENT_TRANSITIONS,
} = require("../constants/order.constants");

const CONFLICT_MSG = "سفارش هم‌زمان تغییر کرد؛ صفحه را تازه کنید و دوباره تلاش کنید";

const stockItemsOf = (items) =>
  items.map((i) => ({ product: i.product, variant: i.variant, quantity: i.quantity }));

/* ------------------------------------------------------------------ */
/* لغو و آزادسازی موجودی                                                */
/* ------------------------------------------------------------------ */

// لغو atomic. سفارش پرداخت‌شده فقط توسط ادمین لغو می‌شود (و علامت «نیاز به برگشت وجه» می‌خورد)؛
// پس اگر همزمان با لغو مشتری/کرون پرداخت انجام شود، سفارش پرداخت‌شده هرگز بی‌صدا لغو نمی‌شود.
const cancelOrderInternal = async (orderId, reason) => {
  const filter = { _id: orderId, orderStatus: { $nin: ["cancelled", "delivered"] } };
  if (reason !== "admin") filter.paymentStatus = { $ne: "paid" };

  const prev = await Order.findOneAndUpdate(
    filter,
    { $set: { orderStatus: "cancelled", cancelReason: reason } },
    { new: false }
  );
  if (!prev) return null;

  if (prev.stockDeducted) {
    await restoreItems(stockItemsOf(prev.items));
    await Order.updateOne({ _id: orderId }, { $set: { stockDeducted: false } });
  }
  if (prev.paymentStatus === "paid") {
    await Order.updateOne({ _id: orderId }, { $set: { refundRequired: true } });
  }
  return Order.findById(orderId);
};

// اگر سرور وسط لغو قطع شده باشد (سفارش لغو شده ولی موجودی برنگشته)، اینجا ترمیم می‌شود
const recoverOrphanStock = async () => {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  const orphans = await Order.find({
    orderStatus: "cancelled",
    stockDeducted: true,
    updatedAt: { $lt: cutoff },
  }).select("_id");

  let fixed = 0;
  for (const { _id } of orphans) {
    const claimed = await Order.findOneAndUpdate(
      { _id, orderStatus: "cancelled", stockDeducted: true },
      { $set: { stockDeducted: false } },
      { new: false }
    );
    if (claimed) {
      await restoreItems(stockItemsOf(claimed.items));
      fixed += 1;
    }
  }
  return fixed;
};

// سفارش‌های پرداخت‌نشده‌ی منقضی را لغو و موجودی را آزاد می‌کند (با کرون و هنگام ثبت سفارش صدا زده می‌شود)
const releaseExpiredOrders = async () => {
  const cutoff = new Date(Date.now() - settings.orderExpireMinutes * 60 * 1000);
  const stale = await Order.find({
    paymentStatus: { $in: ["pending", "failed"] },
    orderStatus: "pending",
    createdAt: { $lt: cutoff },
  }).select("_id");

  let released = 0;
  for (const { _id } of stale) {
    if (await cancelOrderInternal(_id, "expired")) released += 1;
  }

  await recoverOrphanStock();
  return released;
};

// بعد از پرداختِ موفق صدا زده می‌شود. اگر سفارش در این فاصله لغو شده بود:
//  - لغوِ «منقضی‌شدن»: دوباره موجودی رزرو و سفارش فعال می‌شود
//  - در غیر این صورت (یا نبودن موجودی): سفارش علامت «نیاز به برگشت وجه» می‌خورد
const reviveIfPaidAfterExpiry = async (order) => {
  if (!order || order.orderStatus !== "cancelled") return order;

  if (order.cancelReason === "expired") {
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: "cancelled", cancelReason: "expired", stockDeducted: false },
      { $set: { orderStatus: "pending", stockDeducted: true, cancelReason: "" } },
      { new: false }
    );

    if (claimed) {
      const result = await reserveItems(stockItemsOf(claimed.items));
      if (result.ok) return Order.findById(order._id);

      await Order.updateOne(
        { _id: order._id },
        { $set: { orderStatus: "cancelled", stockDeducted: false, cancelReason: "expired", refundRequired: true } }
      );
      console.error(`Order ${order.orderNumber} was paid after expiry but stock is gone — refund needed`);
      return Order.findById(order._id);
    }
  }

  await Order.updateOne({ _id: order._id, orderStatus: "cancelled" }, { $set: { refundRequired: true } });
  console.error(`Order ${order.orderNumber} was paid but is cancelled — refund needed`);
  return Order.findById(order._id);
};

/* ------------------------------------------------------------------ */
/* ثبت سفارش (خرید مهمان، بدون ورود)                                    */
/* ------------------------------------------------------------------ */

// شماره سفارش تصادفی است؛ در حالت نادرِ تکراری بودن دوباره تلاش می‌کنیم
const createWithUniqueNumber = async (data) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Order.create({ ...data, orderNumber: generateOrderNumber(), trackingToken: generateTrackingToken() });
    } catch (err) {
      if (err.code === 11000 && attempt < 4) continue;
      throw err;
    }
  }
  throw new AppError("ثبت سفارش ممکن نشد؛ دوباره تلاش کنید", 500);
};

const createOrder = async (body = {}) => {
  const { customer, shippingAddress, note } = validateCheckoutInfo(body);

  // سفارش‌های منقضی را اول آزاد می‌کنیم تا موجودی واقعی دیده شود
  await releaseExpiredOrders().catch((err) => console.error("Release expired failed:", err.message));

  // چون حساب کاربری نداریم، شماره موبایل مانع قفل کردن موجودی با سفارش‌های پرداخت‌نشده می‌شود
  const pendingCount = await Order.countDocuments({
    "customer.phone": customer.phone,
    orderStatus: "pending",
    paymentStatus: { $ne: "paid" },
  });
  if (pendingCount >= settings.maxPendingOrdersPerPhone) {
    throw new AppError("ابتدا سفارش‌های پرداخت‌نشده‌ی قبلی را پرداخت یا لغو کنید", 429);
  }

  // قیمت و موجودی دقیق همان سایز+رنگ از دیتابیس
  const cart = await resolveCart(body.items);
  const problems = cart.lines.filter((l) => !l.ok);
  if (problems.length > 0) {
    throw new AppError(problems[0].message, 409, {
      issues: problems.map((p) => ({
        productId: p.productId,
        variantId: p.variantId,
        code: p.code,
        message: p.message,
        available: p.available ?? 0,
      })),
    });
  }

  const items = cart.lines.map((l) => ({
    product: l.productId,
    variant: l.variantId,
    title: l.title,
    image: l.image,
    size: l.size,
    colorName: l.colorName,
    colorCode: l.colorCode,
    sku: l.sku,
    quantity: l.quantity,
    price: l.price,
    totalPrice: l.totalPrice,
  }));

  // رزرو اتمیک موجودی (اگر کسی همزمان آخرین جنس را گرفته باشد اینجا رد می‌شود)
  const stockItems = stockItemsOf(items);
  const reservation = await reserveItems(stockItems);
  if (!reservation.ok) {
    const failed = items.find((i) => String(i.variant) === String(reservation.failed.variant));
    throw new AppError(`موجودی «${failed ? failed.title : "یکی از کالاها"}» همین الان تمام شد`, 409, {
      issues: [
        {
          productId: String(reservation.failed.product),
          variantId: String(reservation.failed.variant),
          code: "INSUFFICIENT_STOCK",
          message: "موجودی کافی نیست",
          available: 0,
        },
      ],
    });
  }

  try {
    return await createWithUniqueNumber({
      customer,
      shippingAddress,
      note,
      items,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      totalPrice: cart.totalPrice,
      paymentStatus: "pending",
      orderStatus: "pending",
      stockDeducted: true,
    });
  } catch (err) {
    await restoreItems(stockItems); // ثبت سفارش شکست خورد؛ موجودی را برگردان
    throw err;
  }
};

/* ------------------------------------------------------------------ */
/* دسترسی مشتری مهمان                                                   */
/* ------------------------------------------------------------------ */

const TOKEN_RE = /^[a-f0-9]{48}$/;

const getOrderByToken = async (token) => {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) throw new AppError("سفارش یافت نشد", 404);
  const order = await Order.findOne({ trackingToken: token });
  if (!order) throw new AppError("سفارش یافت نشد", 404);
  return order;
};

// پیگیری با شماره سفارش + موبایل (فقط خواندن؛ توکن برنمی‌گردد)
const lookupOrder = async ({ orderNumber, phone } = {}) => {
  const normalized = normalizePhone(typeof phone === "string" ? phone : "");
  if (typeof orderNumber !== "string" || !/^\d{6}-\d{6}$/.test(orderNumber.trim()) || !isValidIranPhone(normalized)) {
    throw new AppError("سفارشی با این مشخصات پیدا نشد", 404);
  }
  const order = await Order.findOne({ orderNumber: orderNumber.trim(), "customer.phone": normalized });
  if (!order) throw new AppError("سفارشی با این مشخصات پیدا نشد", 404);
  return order;
};

const cancelOrderByToken = async (token) => {
  const order = await getOrderByToken(token);

  if (order.orderStatus !== "pending" || order.paymentStatus === "paid") {
    throw new AppError("فقط سفارش‌های پرداخت‌نشده و در انتظار قابل لغو هستند", 400);
  }
  const cancelled = await cancelOrderInternal(order._id, "customer");
  if (!cancelled) throw new AppError("وضعیت سفارش تغییر کرده و دیگر قابل لغو نیست", 409);
  return cancelled;
};

/* ------------------------------------------------------------------ */
/* ادمین                                                               */
/* ------------------------------------------------------------------ */

const listOrdersAdmin = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (ORDER_STATUSES.includes(query.orderStatus)) filter.orderStatus = query.orderStatus;
  if (PAYMENT_STATUSES.includes(query.paymentStatus)) filter.paymentStatus = query.paymentStatus;
  if (query.refundRequired === "true") filter.refundRequired = true;

  if (typeof query.search === "string" && query.search.trim()) {
    const s = query.search.trim().slice(0, 100);
    const phone = normalizePhone(s);
    filter.$or = [
      { orderNumber: s },
      ...(isValidIranPhone(phone) ? [{ "customer.phone": phone }] : []),
      { "customer.fullName": { $regex: escapeRegex(s), $options: "i" } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort("-createdAt").skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return { orders, ...buildMeta(total, page, limit) };
};

const getOrderAdmin = async (orderId) => {
  if (!isMongoId(orderId)) throw new AppError("شناسه سفارش معتبر نیست", 400);
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("سفارش یافت نشد", 404);
  return order;
};

const updateOrderStatus = async (orderId, payload = {}) => {
  const order = await getOrderAdmin(orderId);

  const { orderStatus, trackingCode } = payload;
  if (orderStatus !== undefined && !ORDER_STATUSES.includes(orderStatus)) {
    throw new AppError("وضعیت سفارش معتبر نیست", 400);
  }
  if (trackingCode !== undefined && (typeof trackingCode !== "string" || trackingCode.length > 100)) {
    throw new AppError("کد رهگیری معتبر نیست", 400);
  }
  if (orderStatus === undefined && trackingCode === undefined) {
    throw new AppError("وضعیت یا کد رهگیری را ارسال کنید", 400);
  }

  const set = {};

  if (orderStatus !== undefined && orderStatus !== order.orderStatus) {
    if (!ORDER_TRANSITIONS[order.orderStatus].includes(orderStatus)) {
      throw new AppError("تغییر به این وضعیت از وضعیت فعلی مجاز نیست", 400);
    }
    if (["processing", "shipped", "delivered"].includes(orderStatus) && order.paymentStatus !== "paid") {
      throw new AppError("این سفارش هنوز پرداخت نشده است", 400);
    }

    if (orderStatus === "cancelled") {
      const cancelled = await cancelOrderInternal(order._id, "admin");
      if (!cancelled) throw new AppError(CONFLICT_MSG, 409);
      if (trackingCode !== undefined) {
        await Order.updateOne({ _id: order._id }, { $set: { trackingCode: trackingCode.trim() } });
      }
      return Order.findById(order._id);
    }

    set.orderStatus = orderStatus;
    if (orderStatus === "delivered") set.deliveredAt = new Date();
  }

  if (trackingCode !== undefined) set.trackingCode = trackingCode.trim();
  if (Object.keys(set).length === 0) return order;

  // فقط اگر سفارش هنوز در همان وضعیتی است که خواندیم؛ وگرنه تغییر هم‌زمان را نادیده نمی‌گیریم
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus },
    { $set: set },
    { new: true }
  );
  if (!updated) throw new AppError(CONFLICT_MSG, 409);
  return updated;
};

// فقط «برگشت وجه انجام شد» را می‌شود دستی ثبت کرد؛ «پرداخت‌شده» فقط از طرف درگاه ثبت می‌شود
const markRefunded = async (orderId, payload = {}) => {
  const order = await getOrderAdmin(orderId);

  const { paymentStatus } = payload;
  if (!PAYMENT_STATUSES.includes(paymentStatus)) throw new AppError("وضعیت پرداخت معتبر نیست", 400);
  if (paymentStatus === order.paymentStatus) return order;

  const allowed = ADMIN_PAYMENT_TRANSITIONS[order.paymentStatus] || [];
  if (!allowed.includes(paymentStatus)) {
    throw new AppError("ادمین فقط می‌تواند پرداخت‌شده را به «برگشت وجه‌شده» تغییر دهد", 400);
  }
  if (order.orderStatus !== "cancelled") {
    throw new AppError("برای برگشت وجه، ابتدا سفارش را لغو کنید", 400);
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: "paid" },
    { $set: { paymentStatus: "refunded", refundRequired: false } },
    { new: true }
  );
  if (!updated) throw new AppError(CONFLICT_MSG, 409);
  return updated;
};

module.exports = {
  createOrder,
  getOrderByToken,
  lookupOrder,
  cancelOrderByToken,
  releaseExpiredOrders,
  reviveIfPaidAfterExpiry,
  listOrdersAdmin,
  getOrderAdmin,
  updateOrderStatus,
  markRefunded,
};
