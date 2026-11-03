import { toman } from "./format";

// مقدار پیش‌فرض تا وقتی بک‌اند در دسترس نیست (env فقط پیش‌فرض است؛ مقدار واقعی را فروشنده از پنل می‌گذارد)
export const DEFAULT_SHIPPING = {
  price: Number(process.env.NEXT_PUBLIC_SHIPPING_PRICE || 80000),
  freeThreshold: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 2000000),
};

// آستانه‌ی ۰ یعنی «ارسال رایگان نداریم»، هزینه‌ی ۰ یعنی «همه‌ی سفارش‌ها رایگان»
export const hasFreeThreshold = (s) => s.price > 0 && s.freeThreshold > 0;

export const shippingMessage = (s) => {
  if (s.price === 0) return "ارسال رایگان برای همه‌ی سفارش‌ها";
  if (s.freeThreshold > 0) return `ارسال رایگان برای خرید بالای ${toman(s.freeThreshold)} تومان`;
  return `هزینه‌ی ارسال ${toman(s.price)} تومان`;
};
