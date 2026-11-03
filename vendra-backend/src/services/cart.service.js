const Product = require("../models/product.model");
const AppError = require("../utils/appError");
const settings = require("../config/settings");
const { isMongoId } = require("../utils/validators");
const { calcShipping } = require("../utils/shipping");
const { getShipping } = require("./shopSettings.service");

// ساختار سبد را بررسی و آیتم‌های تکراری (همان محصول+variant) را جمع می‌کند
const normalizeCartItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) throw new AppError("سبد خرید خالی است", 400);
  if (items.length > settings.maxItemsPerOrder) throw new AppError("تعداد آیتم‌های سبد خرید زیاد است", 400);

  const merged = new Map();
  for (const raw of items) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new AppError("آیتم سبد خرید معتبر نیست", 400);
    if (!isMongoId(raw.productId)) throw new AppError("شناسه محصول معتبر نیست", 400);
    if (!isMongoId(raw.variantId)) throw new AppError("سایز/رنگ انتخاب‌شده معتبر نیست", 400);
    if (!Number.isInteger(raw.quantity) || raw.quantity < 1) {
      throw new AppError("تعداد باید عدد صحیح و حداقل ۱ باشد", 400);
    }

    const productId = raw.productId.toLowerCase();
    const variantId = raw.variantId.toLowerCase();
    const key = `${productId}|${variantId}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += raw.quantity;
    else merged.set(key, { productId, variantId, quantity: raw.quantity });
  }

  const result = [...merged.values()];
  if (result.some((i) => i.quantity > settings.maxQtyPerItem)) {
    throw new AppError(`حداکثر تعداد هر کالا ${settings.maxQtyPerItem} عدد است`, 400);
  }
  return result;
};

// شرط‌های ارسال از تنظیمات فروشگاه (قابل تغییر در پنل) می‌آید، نه از کد
const calcTotals = (itemsPrice, shipping) => {
  const shippingPrice = calcShipping(itemsPrice, shipping);
  return { itemsPrice, shippingPrice, totalPrice: itemsPrice + shippingPrice };
};

/*
  سبد را با دیتابیس تطبیق می‌دهد: قیمت همیشه از دیتابیس می‌آید (نه از کلاینت)،
  و موجودی همان سایز+رنگ بررسی می‌شود.
  هر خط یک وضعیت دارد: ok=true یا issue با code و message.
*/
const resolveCart = async (rawItems) => {
  const items = normalizeCartItems(rawItems);
  const ids = [...new Set(items.map((i) => i.productId))];
  const [products, shipping] = await Promise.all([Product.find({ _id: { $in: ids } }), getShipping()]);
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  for (const item of items) {
    const base = { productId: item.productId, variantId: item.variantId, quantity: item.quantity };
    const product = byId.get(item.productId);

    if (!product || !product.isPublished) {
      lines.push({ ...base, ok: false, code: "PRODUCT_UNAVAILABLE", message: "این محصول دیگر در دسترس نیست" });
      continue;
    }

    const variant = product.variants.id(item.variantId);
    const info = {
      ...base,
      title: product.title,
      image: product.images[0] || "",
    };

    if (!variant) {
      lines.push({ ...info, ok: false, code: "VARIANT_NOT_FOUND", message: `سایز/رنگ انتخاب‌شده برای «${product.title}» موجود نیست` });
      continue;
    }

    const detail = {
      ...info,
      size: variant.size,
      colorName: variant.colorName,
      colorCode: variant.colorCode,
      sku: variant.sku,
      price: product.finalPrice,
      available: Math.min(variant.stock, settings.maxQtyPerItem),
    };
    const label = `«${product.title}» (${[variant.size, variant.colorName].filter(Boolean).join(" / ")})`;

    if (variant.stock <= 0) {
      lines.push({ ...detail, ok: false, code: "OUT_OF_STOCK", message: `${label} تمام شده است` });
    } else if (variant.stock < item.quantity) {
      lines.push({ ...detail, ok: false, code: "INSUFFICIENT_STOCK", message: `از ${label} فقط ${variant.stock} عدد موجود است` });
    } else {
      lines.push({ ...detail, ok: true, totalPrice: product.finalPrice * item.quantity });
    }
  }

  const itemsPrice = lines.filter((l) => l.ok).reduce((sum, l) => sum + l.totalPrice, 0);
  return {
    lines,
    ...calcTotals(itemsPrice, shipping),
    // برای نمایش «تا ارسال رایگان X تومان مانده» در سبد
    freeShippingThreshold: shipping.freeShippingThreshold,
    canCheckout: lines.every((l) => l.ok),
  };
};

module.exports = { normalizeCartItems, resolveCart, calcTotals };
