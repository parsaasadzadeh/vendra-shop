const AppError = require("../utils/appError");

// اگر ADMIN_IP_ALLOWLIST تنظیم شده باشد، فقط همین IPها به /api/admin دسترسی دارند
const normalizeIp = (ip) => String(ip || "").replace(/^::ffff:/, "");

const adminIpAllowlist = (req, res, next) => {
  const allowed = (process.env.ADMIN_IP_ALLOWLIST || "")
    .split(",")
    .map((s) => normalizeIp(s.trim()))
    .filter(Boolean);

  if (allowed.length === 0) return next();
  if (allowed.includes(normalizeIp(req.ip))) return next();
  return next(new AppError("دسترسی غیرمجاز", 403));
};

module.exports = adminIpAllowlist;
