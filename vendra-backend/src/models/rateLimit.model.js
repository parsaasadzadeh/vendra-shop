const mongoose = require("mongoose");

// شمارنده‌ی محدودیت درخواست در دیتابیس (در Serverless حافظه بین اجراها مشترک نیست)
const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RateLimit", rateLimitSchema);
