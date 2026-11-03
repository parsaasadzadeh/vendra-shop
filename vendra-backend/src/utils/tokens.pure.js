const crypto = require("crypto");

// کد رهگیری غیرقابل حدس برای مشتری مهمان (۴۸ کاراکتر هگز)
const generateTrackingToken = () => crypto.randomBytes(24).toString("hex");

// شماره سفارش خوانا برای مشتری: 261101-483920
const generateOrderNumber = () => {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}-${crypto.randomInt(100000, 1000000)}`;
};

module.exports = { generateTrackingToken, generateOrderNumber };
