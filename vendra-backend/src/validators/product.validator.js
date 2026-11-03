const AppError = require("../utils/appError");
const { cleanText } = require("../utils/validators");
const { slugify, RESERVED_SLUGS, MAX_SLUG_LENGTH } = require("../utils/slug");

const GENDERS = ["men", "women", "kids", "unisex"];
const MAX_STOCK = 1_000_000;

const parseJson = (field, label) => {
  if (field === undefined || field === null || field === "") return undefined;
  if (typeof field !== "string") return field;
  try {
    return JSON.parse(field);
  } catch {
    throw new AppError(`فرمت ${label} معتبر نیست`, 400);
  }
};

// قیمت‌ها تومان و عدد صحیح هستند (اعشار باعث ناهماهنگی مبلغ پرداخت می‌شود)
const toInt = (value, label, { max = 1_000_000_000 } = {}) => {
  if (value === "" || value === null || typeof value === "boolean" || Array.isArray(value)) {
    throw new AppError(`${label} باید عدد صحیح و غیرمنفی باشد`, 400);
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > max) {
    throw new AppError(`${label} باید عدد صحیح و غیرمنفی باشد`, 400);
  }
  return n;
};

// یک ترکیب سایز/رنگ را تمیز می‌کند. partial=true برای ویرایش (فقط فیلدهای ارسال‌شده)
const cleanVariant = (raw, { partial = false } = {}) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new AppError("اطلاعات سایز/رنگ معتبر نیست", 400);

  const out = {};
  if (!partial || raw.size !== undefined) {
    out.size = cleanText(raw.size, { label: "سایز", required: true, max: 30 });
  }
  if (!partial || raw.colorName !== undefined) {
    out.colorName = cleanText(raw.colorName, { label: "نام رنگ", max: 40 });
  }
  if (!partial || raw.colorCode !== undefined) {
    const code = cleanText(raw.colorCode, { label: "کد رنگ", max: 7 });
    if (code && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(code)) {
      throw new AppError("کد رنگ باید به شکل #RRGGBB باشد", 400);
    }
    out.colorCode = code;
  }
  if (!partial || raw.sku !== undefined) {
    out.sku = cleanText(raw.sku, { label: "SKU", max: 60 });
  }
  if (!partial || raw.stock !== undefined) {
    out.stock = raw.stock === undefined ? 0 : toInt(raw.stock, "موجودی", { max: MAX_STOCK });
  }
  return out;
};

const variantKey = (v) => `${v.size.toLowerCase()}|${(v.colorName || "").toLowerCase()}`;

const cleanVariants = (raw, { required = true } = {}) => {
  const list = parseJson(raw, "سایز و رنگ‌ها");
  if (list === undefined) {
    if (required) throw new AppError("حداقل یک ترکیب سایز/رنگ لازم است", 400);
    return [];
  }
  if (!Array.isArray(list)) throw new AppError("فرمت سایز و رنگ‌ها معتبر نیست", 400);
  if (required && list.length === 0) throw new AppError("حداقل یک ترکیب سایز/رنگ لازم است", 400);

  const variants = list.map((v) => cleanVariant(v));
  if (new Set(variants.map(variantKey)).size !== variants.length) {
    throw new AppError("ترکیب سایز و رنگ تکراری وارد شده است", 400);
  }
  return variants;
};

// slug دستی ادمین: نرمال می‌شود و باید خالی/رزروشده نباشد
const cleanSlug = (raw) => {
  if (typeof raw !== "string") throw new AppError("آدرس محصول (slug) معتبر نیست", 400);
  const slug = slugify(raw).slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "");
  if (!slug || RESERVED_SLUGS.has(slug)) throw new AppError("آدرس محصول (slug) معتبر نیست", 400);
  return slug;
};

// فیلدهای عمومی محصول. partial=true برای ویرایش
const cleanProductFields = (payload = {}, { partial = false } = {}) => {
  const out = {};

  if (!partial || payload.title !== undefined) {
    out.title = cleanText(payload.title, { label: "نام محصول", required: true, max: 200 });
  }
  if (!partial || payload.price !== undefined) {
    if (payload.price === undefined) throw new AppError("قیمت محصول الزامی است", 400);
    out.price = toInt(payload.price, "قیمت");
  }
  if (payload.slug !== undefined && payload.slug !== "") out.slug = cleanSlug(payload.slug);
  if (payload.discountPrice !== undefined) out.discountPrice = toInt(payload.discountPrice, "قیمت تخفیف");
  if (payload.description !== undefined) {
    out.description = cleanText(payload.description, { label: "توضیحات", max: 5000, multiline: true });
  }
  if (payload.category !== undefined) out.category = cleanText(payload.category, { label: "دسته‌بندی", max: 60 }) || "عمومی";
  if (payload.brand !== undefined) out.brand = cleanText(payload.brand, { label: "برند", max: 60 });
  if (payload.gender !== undefined) {
    if (!GENDERS.includes(payload.gender)) throw new AppError("جنسیت معتبر نیست", 400);
    out.gender = payload.gender;
  }
  for (const flag of ["isPublished", "isFeatured"]) {
    if (payload[flag] !== undefined) {
      if (payload[flag] === true || payload[flag] === "true") out[flag] = true;
      else if (payload[flag] === false || payload[flag] === "false") out[flag] = false;
      else throw new AppError("مقدار گزینه‌ها معتبر نیست", 400);
    }
  }
  return out;
};

module.exports = { GENDERS, toInt, cleanVariant, cleanVariants, cleanProductFields, cleanSlug, MAX_STOCK };
