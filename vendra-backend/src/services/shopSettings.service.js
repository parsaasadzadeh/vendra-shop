const ShopSettings = require("../models/shopSettings.model");
const defaults = require("../config/settings");
const { cleanShippingSettings } = require("../validators/settings.validator");

const KEY = "main";

// مقدار ذخیره‌شده در دیتابیس؛ اگر نبود مقدار پیش‌فرض (.env)
const mergeShipping = (doc) => ({
  shippingPrice: doc && doc.shippingPrice !== undefined && doc.shippingPrice !== null ? doc.shippingPrice : defaults.shippingPrice,
  freeShippingThreshold:
    doc && doc.freeShippingThreshold !== undefined && doc.freeShippingThreshold !== null
      ? doc.freeShippingThreshold
      : defaults.freeShippingThreshold,
});

// عمداً کش نمی‌شود: قیمت ارسالِ نمایش‌داده‌شده و قیمت ثبت‌شده در سفارش باید همیشه یکی باشند
const getShipping = async () => {
  const doc = await ShopSettings.findOne({ key: KEY }).select("shippingPrice freeShippingThreshold").lean();
  return mergeShipping(doc);
};

const getAdminSettings = async () => {
  const doc = await ShopSettings.findOne({ key: KEY }).lean();
  return { ...mergeShipping(doc), updatedAt: doc ? doc.updatedAt : null };
};

const updateShipping = async (payload) => {
  const fields = cleanShippingSettings(payload);
  const run = () =>
    ShopSettings.findOneAndUpdate({ key: KEY }, { $set: fields }, { upsert: true, new: true, runValidators: true }).lean();

  let doc;
  try {
    doc = await run();
  } catch (err) {
    if (err.code !== 11000) throw err; // دو upsert هم‌زمان؛ بار دوم سند وجود دارد
    doc = await run();
  }
  return { ...mergeShipping(doc), updatedAt: doc.updatedAt };
};

module.exports = { getShipping, getAdminSettings, updateShipping, mergeShipping };
