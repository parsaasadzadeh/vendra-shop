const Admin = require("../models/admin.model");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAdminToken } = require("../utils/tokens");
const { isMongoId } = require("../utils/validators");

const DENIED = "برای ادامه وارد پنل مدیریت شوید";

// فقط ادمین‌های واردشده. هر خطای توکن (منقضی، دستکاری‌شده، باطل‌شده) همان پیام یکسان را می‌دهد
const adminAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new AppError(DENIED, 401);

  let decoded;
  try {
    decoded = verifyAdminToken(header.slice(7));
  } catch {
    throw new AppError(DENIED, 401);
  }

  if (!decoded || !isMongoId(String(decoded.sub))) throw new AppError(DENIED, 401);

  const admin = await Admin.findById(decoded.sub);
  // tokenVersion با هر خروج/تغییر رمز عوض می‌شود؛ توکن قدیمی دیگر کار نمی‌کند
  if (!admin || !admin.isActive || admin.tokenVersion !== decoded.tv) throw new AppError(DENIED, 401);

  req.admin = admin;
  next();
});

module.exports = adminAuth;
