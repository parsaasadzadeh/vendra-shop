const AppError = require("../utils/appError");
const safeEqual = require("../utils/safeEqual");

// کرون با هدر Authorization: Bearer <CRON_SECRET>
const cronAuth = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (secret && safeEqual(req.headers.authorization || "", `Bearer ${secret}`)) return next();
  return next(new AppError("دسترسی غیرمجاز", 403));
};

module.exports = cronAuth;
