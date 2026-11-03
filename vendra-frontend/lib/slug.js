// همان منطق slugify بک‌اند (src/utils/slug.js)؛ فقط برای پیش‌نمایش آدرس در فرم ادمین.
// slug نهایی را همیشه سرور می‌سازد/یکتا می‌کند.
const DIGITS_FA = "۰۱۲۳۴۵۶۷۸۹";
const DIGITS_AR = "٠١٢٣٤٥٦٧٨٩";

export const slugify = (text = "") =>
  String(text ?? "")
    .normalize("NFKC")
    .replace(/[۰-۹]/g, (d) => DIGITS_FA.indexOf(d))
    .replace(/[٠-٩]/g, (d) => DIGITS_AR.indexOf(d))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u060C\u061B\u061F\u066A-\u066D\u06D4]/g, "")
    .replace(/[\u200c\u200d\u200e\u200f\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
