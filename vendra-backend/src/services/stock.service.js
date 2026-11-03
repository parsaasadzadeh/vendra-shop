const Product = require("../models/product.model");

/*
  موجودی هر variant (ترکیب سایز+رنگ) جداگانه رزرو می‌شود.
  کم/زیاد کردن موجودی یک عملیات atomic داخل دیتابیس است؛
  پس دو خریدار همزمان نمی‌توانند آخرین جنس را با هم بخرند.
*/

const reserveItem = async ({ product, variant, quantity }) => {
  const result = await Product.updateOne(
    { _id: product, variants: { $elemMatch: { _id: variant, stock: { $gte: quantity } } } },
    { $inc: { "variants.$.stock": -quantity } }
  );
  return result.modifiedCount === 1;
};

// موجودی را برمی‌گرداند. خطا لاگ می‌شود ولی بقیه‌ی آیتم‌ها ادامه پیدا می‌کنند
const restoreItems = async (items) => {
  for (const { product, variant, quantity } of items) {
    try {
      await Product.updateOne({ _id: product, "variants._id": variant }, { $inc: { "variants.$.stock": quantity } });
    } catch (err) {
      console.error(`Stock restore failed: product ${product}, variant ${variant}, qty ${quantity}:`, err.message);
    }
  }
};

// همه یا هیچ: اگر یکی شکست بخورد آنچه تا آن لحظه رزرو شده برگردانده می‌شود
const reserveItems = async (items) => {
  const done = [];
  for (const item of items) {
    const ok = await reserveItem(item);
    if (!ok) {
      await restoreItems(done);
      return { ok: false, failed: item };
    }
    done.push(item);
  }
  return { ok: true };
};

module.exports = { reserveItems, restoreItems };
