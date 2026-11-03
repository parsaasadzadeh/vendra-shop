const AppError = require("./appError");

const toEnglishDigits = (value) =>
  String(value ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

// 09123456789 / ۰۹۱۲... / +98912... / 912... → 09123456789
const normalizePhone = (value) => {
  if (typeof value !== "string") return "";
  let p = toEnglishDigits(value).replace(/[\s-]/g, "");
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  else if (p.startsWith("0098")) p = "0" + p.slice(4);
  else if (/^9\d{9}$/.test(p)) p = "0" + p;
  return p;
};

const isValidIranPhone = (phone) => typeof phone === "string" && /^09\d{9}$/.test(phone);
const isValidPostalCode = (code) => typeof code === "string" && /^\d{10}$/.test(code);
const isMongoId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// متن ورودی را تمیز و اعتبارسنجی می‌کند (حذف کاراکترهای کنترلی، فاصله‌های اضافه، محدودیت طول)
const cleanText = (value, { label, min = 0, max = 300, required = false, multiline = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new AppError(`${label} الزامی است`, 400);
    return "";
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new AppError(`${label} معتبر نیست`, 400);
  }

  let text = String(value);
  if (multiline) {
    text = text.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  } else {
    text = text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ");
  }
  text = text.trim();

  if (!text) {
    if (required) throw new AppError(`${label} الزامی است`, 400);
    return "";
  }
  if (text.length < min) throw new AppError(`${label} خیلی کوتاه است`, 400);
  if (text.length > max) throw new AppError(`${label} حداکثر ${max} کاراکتر می‌تواند باشد`, 400);
  return text;
};

module.exports = {
  toEnglishDigits,
  normalizePhone,
  isValidIranPhone,
  isValidPostalCode,
  isMongoId,
  escapeRegex,
  cleanText,
};
