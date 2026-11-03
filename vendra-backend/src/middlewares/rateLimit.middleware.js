const rateLimit = require("express-rate-limit");

// محدودیت عمومی (در حافظه؛ فقط یک لایه‌ی کمکی است).
// محدودیت‌های مهم (ورود ادمین، ثبت سفارش، پرداخت) در dbRateLimit.middleware.js و داخل دیتابیس هستند.
// سقف بالا است چون چند کاربر موبایل ممکن است پشت یک IP مشترک (CGNAT) باشند.
module.exports = {
  apiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید" },
  }),
};
