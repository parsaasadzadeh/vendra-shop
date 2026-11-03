const AppError = require("../utils/appError");
const {
  toEnglishDigits,
  normalizePhone,
  isValidIranPhone,
  isValidPostalCode,
  cleanText,
} = require("../utils/validators");

const asObject = (value, message) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AppError(message, 400);
  return value;
};

// اطلاعات مشتری مهمان + آدرس ارسال را اعتبارسنجی و تمیز می‌کند. فقط فیلدهای مجاز برمی‌گردند.
const validateCheckoutInfo = (body) => {
  asObject(body, "اطلاعات سفارش معتبر نیست");
  const c = asObject(body.customer, "اطلاعات خریدار کامل نیست");
  const a = asObject(body.shippingAddress, "اطلاعات آدرس کامل نیست");

  const phone = normalizePhone(typeof c.phone === "string" || typeof c.phone === "number" ? String(c.phone) : "");
  if (!isValidIranPhone(phone)) throw new AppError("شماره موبایل معتبر نیست (مثال: 09123456789)", 400);

  const postalCode = toEnglishDigits(cleanText(a.postalCode, { label: "کد پستی", required: true, max: 20 }));
  if (!isValidPostalCode(postalCode)) throw new AppError("کد پستی باید ۱۰ رقم باشد", 400);

  return {
    customer: {
      fullName: cleanText(c.fullName, { label: "نام و نام خانوادگی", required: true, min: 3, max: 100 }),
      phone,
    },
    shippingAddress: {
      province: cleanText(a.province, { label: "استان", required: true, max: 60 }),
      city: cleanText(a.city, { label: "شهر", required: true, max: 60 }),
      fullAddress: cleanText(a.fullAddress, { label: "آدرس", required: true, min: 8, max: 300 }),
      plaque: toEnglishDigits(cleanText(a.plaque, { label: "پلاک", required: true, max: 20 })),
      unit: toEnglishDigits(cleanText(a.unit, { label: "واحد", max: 20 })),
      postalCode,
    },
    note: cleanText(body.note, { label: "توضیحات", max: 500, multiline: true }),
  };
};

module.exports = { validateCheckoutInfo };
