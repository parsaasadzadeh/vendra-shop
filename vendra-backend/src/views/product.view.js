const settings = require("../config/settings");

const baseFields = (p) => ({
  id: String(p._id),
  title: p.title,
  slug: p.slug,
  description: p.description,
  price: p.price,
  discountPrice: p.discountPrice,
  finalPrice: p.finalPrice,
  hasDiscount: p.discountPrice > 0,
  category: p.category,
  brand: p.brand,
  gender: p.gender,
  images: p.images,
  isFeatured: p.isFeatured,
  createdAt: p.createdAt,
});

// لیست سایزها و رنگ‌های یکتا (برای ساخت انتخاب‌گرهای فرانت)
const buildOptions = (variants) => {
  const sizes = new Map();
  const colors = new Map();
  for (const v of variants) {
    const has = v.stock > 0;
    sizes.set(v.size, (sizes.get(v.size) || false) || has);
    if (v.colorName) {
      const prev = colors.get(v.colorName) || { name: v.colorName, code: v.colorCode, inStock: false };
      prev.inStock = prev.inStock || has;
      colors.set(v.colorName, prev);
    }
  }
  return {
    sizes: [...sizes].map(([size, inStock]) => ({ size, inStock })),
    colors: [...colors.values()],
  };
};

// نمای عمومی (مشتری): موجودی دقیق نمایش داده نمی‌شود؛ حداکثر به اندازه‌ی سقف خرید
const publicVariant = (v) => ({
  id: String(v._id),
  size: v.size,
  colorName: v.colorName,
  colorCode: v.colorCode,
  inStock: v.stock > 0,
  stock: Math.min(v.stock, settings.maxQtyPerItem),
});

const toPublic = (p) => ({
  ...baseFields(p),
  inStock: p.variants.some((v) => v.stock > 0),
  options: buildOptions(p.variants),
  variants: p.variants.map(publicVariant),
});

// نمای لیست: سبک‌تر، بدون variantها
const toPublicListItem = (p) => ({
  ...baseFields(p),
  inStock: p.variants.some((v) => v.stock > 0),
  options: buildOptions(p.variants),
});

// نمای ادمین: موجودی دقیق و همه‌ی فیلدها
const toAdmin = (p) => ({
  ...baseFields(p),
  isPublished: p.isPublished,
  slugHistory: p.slugHistory || [],
  totalStock: p.variants.reduce((s, v) => s + Number(v.stock || 0), 0),
  updatedAt: p.updatedAt,
  variants: p.variants.map((v) => ({
    id: String(v._id),
    size: v.size,
    colorName: v.colorName,
    colorCode: v.colorCode,
    sku: v.sku,
    stock: v.stock,
  })),
});

module.exports = { toPublic, toPublicListItem, toAdmin };
