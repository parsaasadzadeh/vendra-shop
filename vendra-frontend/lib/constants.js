export const SITE_NAME = "وندرا";
export const SITE_NAME_EN = "Vendra";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const GENDERS = [
  { value: "men", label: "مردانه" },
  { value: "women", label: "زنانه" },
  { value: "kids", label: "بچگانه" },
  { value: "unisex", label: "یونیسکس" },
];
export const genderLabel = (v) => GENDERS.find((g) => g.value === v)?.label || "";

export const SORTS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
];

export const PROVINCES = [
  "آذربایجان شرقی","آذربایجان غربی","اردبیل","اصفهان","البرز","ایلام","بوشهر","تهران","چهارمحال و بختیاری",
  "خراسان جنوبی","خراسان رضوی","خراسان شمالی","خوزستان","زنجان","سمنان","سیستان و بلوچستان","فارس","قزوین",
  "قم","کردستان","کرمان","کرمانشاه","کهگیلویه و بویراحمد","گلستان","گیلان","لرستان","مازندران","مرکزی",
  "هرمزگان","همدان","یزد",
];

export const PAYMENT_FAIL_REASONS = {
  cancelled: "پرداخت توسط شما لغو شد یا ناموفق بود.",
  verify_failed: "پرداخت شما تایید نشد. اگر مبلغی از حسابتان کسر شده، معمولاً تا ۷۲ ساعت برگشت می‌خورد.",
  refund_pending: "پرداخت انجام شد ولی موجودی کالا در این فاصله تمام شد. سفارش لغو و مبلغ به حساب شما برگردانده می‌شود.",
  amount_mismatch: "مبلغ پرداختی با مبلغ سفارش یکسان نبود. مبلغ به حساب شما برگردانده می‌شود.",
  order_not_found: "سفارش مربوط به این پرداخت پیدا نشد.",
  no_trackId: "اطلاعات بازگشت از درگاه ناقص بود.",
  server_error: "مشکلی در سرور پیش آمد. لطفاً کمی بعد دوباره تلاش کنید.",
};
