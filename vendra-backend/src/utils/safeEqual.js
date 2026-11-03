const crypto = require("crypto");

// مقایسه‌ی رشته‌ها بدون نشت زمانی (timing attack)
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a ?? ""));
  const y = Buffer.from(String(b ?? ""));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
};

module.exports = safeEqual;
