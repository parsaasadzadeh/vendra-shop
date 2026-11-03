// تنظیمات قابل تغییر؛ قیمت‌ها همه به تومان هستند
const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

module.exports = {
  get shippingPrice() {
    return num(process.env.SHIPPING_PRICE, 80000);
  },
  get freeShippingThreshold() {
    return num(process.env.FREE_SHIPPING_THRESHOLD, 2000000);
  },
  // سفارش پرداخت‌نشده بعد از این مدت لغو و موجودی‌اش آزاد می‌شود
  get orderExpireMinutes() {
    return num(process.env.ORDER_EXPIRE_MINUTES, 60);
  },
  // چون ورود نداریم، شماره موبایل مشتری معیار محدودیت است (جلوگیری از قفل کردن موجودی)
  maxPendingOrdersPerPhone: 3,
  maxQtyPerItem: 20,
  maxItemsPerOrder: 30,
  maxImagesPerProduct: 10,
  maxVariantsPerProduct: 100,

  admin: {
    get jwtExpiresIn() {
      return process.env.ADMIN_JWT_EXPIRES_IN || "2h";
    },
    jwtIssuer: "shop-api",
    jwtAudience: "shop-admin",
    maxFailedLogins: 5,
    lockMinutes: 15,
    minPasswordLength: 12,
  },
};
