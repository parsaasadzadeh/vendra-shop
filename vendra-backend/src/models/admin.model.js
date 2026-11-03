const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 40,
      match: /^[a-z0-9._-]+$/,
    },
    // هش scrypt؛ هرگز به‌صورت پیش‌فرض خوانده نمی‌شود
    passwordHash: { type: String, required: true, select: false },
    // با هر خروج/تغییر رمز یکی زیاد می‌شود و همه‌ی توکن‌های قبلی باطل می‌شوند
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
