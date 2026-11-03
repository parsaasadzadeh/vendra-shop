const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

// از هر وضعیت فقط به این وضعیت‌ها می‌شود رفت
const ORDER_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// پرداخت فقط توسط درگاه «paid» می‌شود؛ ادمین فقط می‌تواند بعد از برگشت وجه «refunded» ثبت کند
const ADMIN_PAYMENT_TRANSITIONS = {
  paid: ["refunded"],
};

module.exports = { ORDER_STATUSES, PAYMENT_STATUSES, ORDER_TRANSITIONS, ADMIN_PAYMENT_TRANSITIONS };
