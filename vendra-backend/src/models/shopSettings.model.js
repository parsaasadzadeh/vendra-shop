const mongoose = require("mongoose");

/*
  تنظیمات فروشگاه (فقط یک سند با key="main").
  فیلدی که هنوز ذخیره نشده باشد از مقدار پیش‌فرض (.env / settings.js) خوانده می‌شود،
  پس بدون هیچ مهاجرتی روی فروشگاه فعلی کار می‌کند.
*/
const shopSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    shippingPrice: { type: Number, min: 0 },
    freeShippingThreshold: { type: Number, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopSettings", shopSettingsSchema);
