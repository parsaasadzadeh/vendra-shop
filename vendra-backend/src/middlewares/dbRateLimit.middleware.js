const RateLimit = require("../models/rateLimit.model");
const { normalizePhone, isValidIranPhone } = require("../utils/validators");

// شمارش atomic داخل دیتابیس؛ در Serverless هم درست کار می‌کند
const hit = async (key, windowMs) => {
  const now = Date.now();

  // اگر پنجره‌ی قبلی تمام شده ولی مونگو هنوز رکورد را پاک نکرده، شمارنده را صفر می‌کنیم
  await RateLimit.updateOne({ key, expiresAt: { $lte: new Date(now) } }, { $set: { count: 0, expiresAt: new Date(now + windowMs) } });

  try {
    return await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now + windowMs) } },
      { upsert: true, new: true }
    );
  } catch (err) {
    // دو درخواست همزمان برای اولین بار: یکی upsert می‌کند، دیگری فقط می‌شمارد
    if (err.code === 11000) return RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true });
    throw err;
  }
};

const dbRateLimit =
  ({ name, windowMs, max, message, keyFn }) =>
  async (req, res, next) => {
    try {
      const id = keyFn(req);
      if (!id) return next();

      const doc = await hit(`${name}:${id}`, windowMs);
      if (doc && doc.count > max) {
        const retry = Math.max(1, Math.ceil((doc.expiresAt.getTime() - Date.now()) / 1000));
        res.set("Retry-After", String(retry));
        return res.status(429).json({ success: false, message });
      }
      next();
    } catch (err) {
      next(err);
    }
  };

const byIp = (req) => req.ip;
const byCustomerPhone = (req) => {
  const phone = normalizePhone(req.body && req.body.customer && req.body.customer.phone);
  return isValidIranPhone(phone) ? phone : null; // شماره نامعتبر را خود اعتبارسنجی رد می‌کند
};
const byLookupPhone = (req) => {
  const phone = normalizePhone(req.body && req.body.phone);
  return isValidIranPhone(phone) ? phone : null;
};
const byAdminUsername = (req) => {
  const u = req.body && req.body.username;
  return typeof u === "string" && u.trim() ? u.trim().toLowerCase().slice(0, 40) : null;
};

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

module.exports = {
  // ورود ادمین: هم به ازای IP و هم به ازای نام کاربری (حتی نام‌های ناموجود، تا وجود حساب لو نرود)
  adminLoginIpLimiter: dbRateLimit({
    name: "admin-login-ip",
    windowMs: 15 * MIN,
    max: 20,
    keyFn: byIp,
    message: "تعداد تلاش‌های ورود زیاد است؛ ۱۵ دقیقه دیگر تلاش کنید",
  }),
  adminLoginUserLimiter: dbRateLimit({
    name: "admin-login-user",
    windowMs: 15 * MIN,
    max: 8,
    keyFn: byAdminUsername,
    message: "تعداد تلاش‌های ورود زیاد است؛ ۱۵ دقیقه دیگر تلاش کنید",
  }),
  // ثبت سفارش مهمان: هم IP و هم شماره موبایل (جلوگیری از قفل کردن موجودی)
  checkoutIpLimiter: dbRateLimit({
    name: "checkout-ip",
    windowMs: HOUR,
    max: 20,
    keyFn: byIp,
    message: "تعداد سفارش‌های ثبت‌شده از این شبکه زیاد است؛ کمی بعد تلاش کنید",
  }),
  checkoutPhoneLimiter: dbRateLimit({
    name: "checkout-phone",
    windowMs: HOUR,
    max: 8,
    keyFn: byCustomerPhone,
    message: "تعداد سفارش‌های این شماره زیاد است؛ کمی بعد تلاش کنید",
  }),
  // پیگیری با شماره سفارش + موبایل (جلوگیری از حدس زدن)
  lookupIpLimiter: dbRateLimit({
    name: "lookup-ip",
    windowMs: 15 * MIN,
    max: 30,
    keyFn: byIp,
    message: "تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید",
  }),
  lookupPhoneLimiter: dbRateLimit({
    name: "lookup-phone",
    windowMs: 15 * MIN,
    max: 10,
    keyFn: byLookupPhone,
    message: "تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید",
  }),
  paymentIpLimiter: dbRateLimit({
    name: "payment-ip",
    windowMs: HOUR,
    max: 40,
    keyFn: byIp,
    message: "تعداد درخواست پرداخت زیاد است؛ کمی بعد تلاش کنید",
  }),
};
