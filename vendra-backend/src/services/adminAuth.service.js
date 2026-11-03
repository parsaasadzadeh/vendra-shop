const Admin = require("../models/admin.model");
const AppError = require("../utils/appError");
const settings = require("../config/settings");
const { hashPassword, verifyPassword, getDummyHash, assertStrongPassword } = require("../utils/password");
const { signAdminToken } = require("../utils/tokens");

// پیام یکسان برای «کاربر نیست» / «رمز اشتباه» / «حساب قفل است»؛ مهاجم تفاوتشان را نمی‌فهمد
const INVALID_LOGIN = "نام کاربری یا رمز عبور اشتباه است (یا حساب موقتاً قفل شده است)";

const normalizeUsername = (value) => (typeof value === "string" ? value.trim().toLowerCase().slice(0, 40) : "");

const login = async ({ username, password } = {}) => {
  const name = normalizeUsername(username);
  if (!name || typeof password !== "string" || password.length === 0 || password.length > 128) {
    // برای ورودی خراب هم همان زمان صرف می‌شود
    await verifyPassword("x", await getDummyHash());
    throw new AppError(INVALID_LOGIN, 401);
  }

  const admin = await Admin.findOne({ username: name }).select("+passwordHash");

  // اگر کاربر وجود ندارد هم یک verify کامل انجام می‌دهیم (جلوگیری از timing attack)
  const passwordOk = await verifyPassword(password, admin ? admin.passwordHash : await getDummyHash());
  const locked = Boolean(admin && admin.lockUntil && admin.lockUntil > new Date());

  if (!admin || !admin.isActive || locked || !passwordOk) {
    // حتی اگر رمز درست باشد ولی حساب قفل است، رد می‌شود (و شمارنده بالا نمی‌رود)
    if (admin && admin.isActive && !locked) {
      const updated = await Admin.findOneAndUpdate({ _id: admin._id }, { $inc: { failedLoginAttempts: 1 } }, { new: true });
      if (updated && updated.failedLoginAttempts >= settings.admin.maxFailedLogins) {
        await Admin.updateOne(
          { _id: admin._id },
          { $set: { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + settings.admin.lockMinutes * 60 * 1000) } }
        );
      }
    }
    throw new AppError(INVALID_LOGIN, 401);
  }

  await Admin.updateOne({ _id: admin._id }, { $set: { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date() } });
  return { admin, token: signAdminToken(admin) };
};

// خروج: tokenVersion زیاد می‌شود و همه‌ی توکن‌های صادرشده (حتی از دستگاه‌های دیگر) باطل می‌شوند
const logout = async (adminId) => {
  await Admin.updateOne({ _id: adminId }, { $inc: { tokenVersion: 1 } });
};

const changePassword = async (adminId, { currentPassword, newPassword } = {}) => {
  const admin = await Admin.findById(adminId).select("+passwordHash");
  if (!admin) throw new AppError("دسترسی غیرمجاز", 401);

  if (typeof currentPassword !== "string" || !(await verifyPassword(currentPassword, admin.passwordHash))) {
    throw new AppError("رمز فعلی اشتباه است", 400);
  }
  assertStrongPassword(newPassword, admin.username);
  if (newPassword === currentPassword) throw new AppError("رمز جدید باید با رمز فعلی فرق کند", 400);

  admin.passwordHash = await hashPassword(newPassword);
  admin.tokenVersion += 1; // همه‌ی نشست‌های قبلی باطل می‌شود
  await admin.save();

  return { admin, token: signAdminToken(admin) };
};

module.exports = { login, logout, changePassword, normalizeUsername };
