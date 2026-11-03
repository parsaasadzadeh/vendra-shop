export const ORDER_STATUS = {
  pending: { label: "در انتظار", tone: "warn" },
  processing: { label: "در حال پردازش", tone: "info" },
  shipped: { label: "ارسال‌شده", tone: "info" },
  delivered: { label: "تحویل‌شده", tone: "success" },
  cancelled: { label: "لغو‌شده", tone: "danger" },
};

export const PAYMENT_STATUS = {
  pending: { label: "پرداخت‌نشده", tone: "warn" },
  paid: { label: "پرداخت‌شده", tone: "success" },
  failed: { label: "ناموفق", tone: "danger" },
  refunded: { label: "برگشت وجه‌شده", tone: "info" },
};

// همان جدول بک‌اند: از هر وضعیت فقط به این وضعیت‌ها می‌شود رفت
export const ORDER_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ORDER_ACTION_LABEL = {
  processing: "شروع پردازش",
  shipped: "ثبت ارسال",
  delivered: "ثبت تحویل",
  cancelled: "لغو سفارش",
};

export const CANCEL_REASON = { customer: "مشتری", admin: "ادمین", expired: "انقضای زمان پرداخت" };

export const SIZE_PRESETS = {
  clothes: { label: "لباس", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  numeric: { label: "شلوار/عددی", sizes: ["28", "30", "32", "34", "36", "38"] },
  shoes: { label: "کفش", sizes: ["38", "39", "40", "41", "42", "43", "44"] },
  free: { label: "فری‌سایز", sizes: ["فری‌سایز"] },
};

export const COLOR_PRESETS = [
  { name: "مشکی", code: "#17141f" },
  { name: "سفید", code: "#ffffff" },
  { name: "طوسی", code: "#9ca3af" },
  { name: "سرمه‌ای", code: "#1e3a8a" },
  { name: "آبی", code: "#2563eb" },
  { name: "قرمز", code: "#dc2626" },
  { name: "سبز", code: "#16a34a" },
  { name: "زرد", code: "#facc15" },
  { name: "کرم", code: "#e9dcc3" },
  { name: "قهوه‌ای", code: "#7c4a2d" },
  { name: "صورتی", code: "#f472b6" },
];

export const MAX_VARIANTS = 100;
export const MAX_STOCK = 1_000_000;
export const variantKey = (v) => `${String(v.size).trim().toLowerCase()}|${String(v.colorName || "").trim().toLowerCase()}`;
