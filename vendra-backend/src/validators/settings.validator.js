const AppError = require("../utils/appError");
const { toInt } = require("./product.validator");

const MAX_SHIPPING_PRICE = 10_000_000; // سقف تومان؛ جلوی اشتباه تایپی (یک صفر اضافه)
const MAX_THRESHOLD = 1_000_000_000;

// فقط فیلدهای ارسال‌شده را تمیز می‌کند؛ حداقل یکی لازم است
const cleanShippingSettings = (payload = {}) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("اطلاعات تنظیمات معتبر نیست", 400);
  }

  const out = {};
  if (payload.shippingPrice !== undefined) {
    out.shippingPrice = toInt(payload.shippingPrice, "هزینه‌ی ارسال", { max: MAX_SHIPPING_PRICE });
  }
  if (payload.freeShippingThreshold !== undefined) {
    out.freeShippingThreshold = toInt(payload.freeShippingThreshold, "حداقل خرید برای ارسال رایگان", { max: MAX_THRESHOLD });
  }
  if (Object.keys(out).length === 0) throw new AppError("چیزی برای ویرایش ارسال نشده است", 400);
  return out;
};

module.exports = { cleanShippingSettings, MAX_SHIPPING_PRICE, MAX_THRESHOLD };
