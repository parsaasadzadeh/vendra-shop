const crypto = require("crypto");

// این کلمه‌ها با مسیرهای ثابت /api/products/... تداخل دارند؛ slug محصول نمی‌توانند باشند
const RESERVED_SLUGS = new Set(["categories", "slugs"]);

const MAX_SLUG_LENGTH = 80;

const DIGITS_FA = "۰۱۲۳۴۵۶۷۸۹";
const DIGITS_AR = "٠١٢٣٤٥٦٧٨٩";

/*
  عنوان محصول → slug مناسب URL (فارسی و انگلیسی)
   - ارقام فارسی/عربی → انگلیسی، «ي/ك» عربی → «ی/ک» فارسی
   - نیم‌فاصله و فاصله → خط تیره («تی‌شرت» → «تی-شرت»)
   - اعراب، کشیده و علائم نگارشی حذف می‌شوند
   - idempotent است: slugify(slugify(x)) === slugify(x)
*/
const slugify = (text = "") =>
  String(text ?? "")
    .normalize("NFKC")
    .replace(/[۰-۹]/g, (d) => DIGITS_FA.indexOf(d))
    .replace(/[٠-٩]/g, (d) => DIGITS_AR.indexOf(d))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // اعراب و کشیده
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u060C\u061B\u061F\u066A-\u066D\u06D4]/g, "") // ، ؛ ؟ ٪ ٫ ٬ ٭ ۔
    .replace(/[\u200c\u200d\u200e\u200f\s_]+/g, "-") // نیم‌فاصله، فاصله، زیرخط
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const baseSlug = (title) => slugify(title).slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "") || "product";

/*
  یک slug یکتا می‌سازد: اگر گرفته شده بود -2، -3، ... اضافه می‌کند.
  isTaken(slug) یک تابع async است که می‌گوید slug گرفته شده یا نه.
*/
const uniqueSlug = async (title, isTaken) => {
  const base = baseSlug(title);
  for (let i = 1; i <= 50; i += 1) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    if (!RESERVED_SLUGS.has(candidate) && !(await isTaken(candidate))) return candidate;
  }
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
};

module.exports = { slugify, baseSlug, uniqueSlug, RESERVED_SLUGS, MAX_SLUG_LENGTH };
