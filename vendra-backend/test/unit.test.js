// تست‌های منطق خالص (بدون نیاز به دیتابیس):  node --test test/
const test = require("node:test");
const assert = require("node:assert/strict");

const { hashPassword, verifyPassword, assertStrongPassword } = require("../src/utils/password");
const { normalizePhone, isValidIranPhone, isValidPostalCode, cleanText } = require("../src/utils/validators");
const sanitize = require("../src/utils/sanitize");
const { validateCheckoutInfo } = require("../src/validators/checkout.validator");
const { cleanVariants, cleanVariant, cleanProductFields } = require("../src/validators/product.validator");
const productView = require("../src/views/product.view");
const { slugify, uniqueSlug, baseSlug } = require("../src/utils/slug");
const { calcShipping } = require("../src/utils/shipping");
const { cleanShippingSettings } = require("../src/validators/settings.validator");
const { cleanSlug } = require("../src/validators/product.validator");
const { mergeShipping } = require("../src/services/shopSettings.service");
const { calcTotals } = require("../src/services/cart.service");
const { generateOrderNumber, generateTrackingToken } = require("../src/utils/tokens.pure");

test("password: hash/verify و رد کردن رمز اشتباه", async () => {
  const h = await hashPassword("Correct-Horse-123");
  assert.ok(h.startsWith("scrypt$"));
  assert.equal(await verifyPassword("Correct-Horse-123", h), true);
  assert.equal(await verifyPassword("correct-horse-123", h), false);
  assert.equal(await verifyPassword("x", "garbage"), false);
});

test("password: سیاست رمز قوی", () => {
  assert.throws(() => assertStrongPassword("short1"), /حداقل/);
  assert.throws(() => assertStrongPassword("onlylettersonlyletters"), /عدد/);
  assert.throws(() => assertStrongPassword("admin-user-12345", "admin-user"), /نام کاربری/);
  assert.doesNotThrow(() => assertStrongPassword("a-Strong-pass-2026", "admin"));
});

test("validators: شماره موبایل و کد پستی با ارقام فارسی", () => {
  assert.equal(normalizePhone("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  assert.equal(normalizePhone("+989123456789"), "09123456789");
  assert.equal(normalizePhone("9123456789"), "09123456789");
  assert.ok(isValidIranPhone("09123456789"));
  assert.ok(!isValidIranPhone("0912345"));
  assert.ok(isValidPostalCode("1234567890"));
  assert.ok(!isValidPostalCode("12345"));
  assert.throws(() => cleanText("x".repeat(50), { label: "تست", max: 10 }), /حداکثر/);
});

test("sanitize: کلیدهای $ و نقطه و __proto__ حذف می‌شوند", () => {
  const body = JSON.parse('{"a":{"$gt":"","ok":1},"b.c":2,"__proto__":{"x":1},"list":[{"$ne":1,"y":2}]}');
  sanitize(body);
  assert.deepEqual(body, { a: { ok: 1 }, list: [{ y: 2 }] });
  assert.equal({}.x, undefined);
});

const goodCheckout = () => ({
  customer: { fullName: "علی رضایی", phone: "۰۹۱۲۳۴۵۶۷۸۹" },
  shippingAddress: {
    province: "تهران",
    city: "تهران",
    fullAddress: "خیابان ولیعصر، کوچه نمونه",
    plaque: "۱۲",
    unit: "۴",
    postalCode: "۱۲۳۴۵۶۷۸۹۰",
  },
});

test("checkout: اطلاعات مشتری مهمان اعتبارسنجی و نرمال می‌شود", () => {
  const out = validateCheckoutInfo(goodCheckout());
  assert.equal(out.customer.phone, "09123456789");
  assert.equal(out.shippingAddress.postalCode, "1234567890");
  assert.equal(out.shippingAddress.plaque, "12");
  assert.deepEqual(Object.keys(out.shippingAddress).sort(), ["city", "fullAddress", "plaque", "postalCode", "province", "unit"]);
});

test("checkout: فیلدهای ناقص یا نامعتبر رد می‌شوند", () => {
  const bad = (mutate) => {
    const b = goodCheckout();
    mutate(b);
    return () => validateCheckoutInfo(b);
  };
  assert.throws(bad((b) => (b.customer.phone = "0912")), /موبایل/);
  assert.throws(bad((b) => (b.shippingAddress.postalCode = "123")), /۱۰ رقم/);
  assert.throws(bad((b) => delete b.shippingAddress.plaque), /پلاک/);
  assert.throws(bad((b) => (b.customer.fullName = "")), /الزامی/);
  assert.throws(bad((b) => (b.shippingAddress = null)), /آدرس/);
  assert.throws(bad((b) => (b.customer.fullName = { $gt: "" })), /معتبر/);
});

test("variants: ترکیب سایز/رنگ، تکراری و موجودی نامعتبر", () => {
  const ok = cleanVariants(
    JSON.stringify([
      { size: "L", colorName: "قرمز", colorCode: "#ff0000", stock: 5 },
      { size: "XL", colorName: "قرمز", colorCode: "#ff0000", stock: 0 },
      { size: "XL", colorName: "مشکی", stock: "3" },
    ])
  );
  assert.equal(ok.length, 3);
  assert.equal(ok[2].stock, 3);

  assert.throws(() => cleanVariants([{ size: "L", colorName: "قرمز" }, { size: "l", colorName: "قرمز" }]), /تکراری/);
  assert.throws(() => cleanVariants([{ size: "L", stock: -1 }]), /موجودی/);
  assert.throws(() => cleanVariants([{ size: "L", stock: 1.5 }]), /موجودی/);
  assert.throws(() => cleanVariants([{ size: "L", colorCode: "red" }]), /کد رنگ/);
  assert.throws(() => cleanVariants([]), /حداقل/);
  assert.deepEqual(cleanVariant({ stock: 4 }, { partial: true }), { stock: 4 });
});

test("product fields: قیمت‌ها عدد صحیح، ویرایش جزئی", () => {
  assert.deepEqual(cleanProductFields({ title: " تی‌شرت ", price: "250000" }), { title: "تی‌شرت", price: 250000 });
  assert.throws(() => cleanProductFields({ title: "a", price: "12.5" }), /عدد صحیح/);
  assert.throws(() => cleanProductFields({ title: "a" }), /قیمت/);
  assert.deepEqual(cleanProductFields({ isPublished: "false" }, { partial: true }), { isPublished: false });
  assert.throws(() => cleanProductFields({ gender: "robot" }, { partial: true }), /جنسیت/);
});

test("product view: موجودی هر سایز/رنگ جدا و عدد دقیق برای مشتری محدود", () => {
  const variants = [
    { _id: "1", size: "L", colorName: "قرمز", colorCode: "#f00", stock: 5 },
    { _id: "2", size: "XL", colorName: "قرمز", colorCode: "#f00", stock: 0 },
    { _id: "3", size: "XL", colorName: "مشکی", colorCode: "#000", stock: 500 },
  ];
  const view = productView.toPublic({ _id: "p", title: "t", images: [], discountPrice: 0, variants });
  const xlRed = view.variants.find((v) => v.size === "XL" && v.colorName === "قرمز");
  const lRed = view.variants.find((v) => v.size === "L" && v.colorName === "قرمز");
  assert.equal(xlRed.inStock, false);
  assert.equal(lRed.inStock, true);
  assert.equal(view.variants.find((v) => v.id === "3").stock, 20); // سقف خرید
  assert.equal(view.inStock, true);
});

test("tokens: شماره سفارش و کد رهگیری", () => {
  assert.match(generateOrderNumber(), /^\d{6}-\d{6}$/);
  assert.match(generateTrackingToken(), /^[a-f0-9]{48}$/);
  assert.notEqual(generateTrackingToken(), generateTrackingToken());
});

test("slugify: فارسی، نیم‌فاصله، ارقام و حروف عربی", () => {
  assert.equal(slugify("تی‌شرت مردانه ۲۰۲۶"), "تی-شرت-مردانه-2026");
  assert.equal(slugify("كفش ورزشي"), "کفش-ورزشی");
  assert.equal(slugify("Nike Air Max 90!"), "nike-air-max-90");
  assert.equal(slugify("  پیراهن، آبی؟  "), "پیراهن-آبی");
  assert.equal(slugify("---a___b---"), "a-b");
  assert.equal(slugify("🔥🔥"), "");
  const s = slugify("مانتو  اسپرت (جدید)");
  assert.equal(slugify(s), s); // idempotent
});

test("slug یکتا: پسوند عددی، کلمات رزروشده و عنوان بدون حرف", async () => {
  const taken = new Set(["کفش-ورزشی", "کفش-ورزشی-2"]);
  assert.equal(await uniqueSlug("کفش ورزشی", async (c) => taken.has(c)), "کفش-ورزشی-3");
  assert.equal(await uniqueSlug("کفش جدید", async () => false), "کفش-جدید");
  assert.equal(await uniqueSlug("Categories", async () => false), "categories-2"); // با /products/categories تداخل دارد
  assert.equal(await uniqueSlug("🔥", async () => false), "product");
  assert.ok(baseSlug("الف ".repeat(100)).length <= 80);
});

test("slug دستی ادمین: نرمال می‌شود و مقدار نامعتبر رد می‌شود", () => {
  assert.equal(cleanSlug("My New Shoe"), "my-new-shoe");
  assert.throws(() => cleanSlug("!!!"), /slug/);
  assert.throws(() => cleanSlug("categories"), /slug/);
  assert.throws(() => cleanSlug({ $gt: "" }), /slug/);
  assert.deepEqual(cleanProductFields({ slug: "Red Shirt" }, { partial: true }), { slug: "red-shirt" });
  assert.deepEqual(cleanProductFields({ slug: "" }, { partial: true }), {}); // خالی = دست نزن
});

test("هزینه‌ی ارسال: رایگان بالای آستانه، آستانه‌ی ۰ یعنی غیرفعال، ارسال ۰ یعنی همه رایگان", () => {
  const cfg = { shippingPrice: 80000, freeShippingThreshold: 2000000 };
  assert.equal(calcShipping(0, cfg), 0);
  assert.equal(calcShipping(500000, cfg), 80000);
  assert.equal(calcShipping(2000000, cfg), 0);
  assert.equal(calcShipping(500000, { ...cfg, freeShippingThreshold: 0 }), 80000);
  assert.equal(calcShipping(9e9, { ...cfg, freeShippingThreshold: 0 }), 80000);
  assert.equal(calcShipping(500000, { ...cfg, shippingPrice: 0 }), 0);
  assert.deepEqual(calcTotals(500000, cfg), { itemsPrice: 500000, shippingPrice: 80000, totalPrice: 580000 });
});

test("تنظیمات ارسال: اعتبارسنجی و مقدار پیش‌فرض", () => {
  assert.deepEqual(cleanShippingSettings({ shippingPrice: "95000" }), { shippingPrice: 95000 });
  assert.deepEqual(cleanShippingSettings({ shippingPrice: 0, freeShippingThreshold: 0 }), { shippingPrice: 0, freeShippingThreshold: 0 });
  assert.throws(() => cleanShippingSettings({}), /چیزی/);
  assert.throws(() => cleanShippingSettings({ shippingPrice: -1 }), /عدد صحیح/);
  assert.throws(() => cleanShippingSettings({ shippingPrice: 12.5 }), /عدد صحیح/);
  assert.throws(() => cleanShippingSettings({ shippingPrice: 99_000_000 }), /عدد صحیح/); // اشتباه تایپی
  assert.throws(() => cleanShippingSettings({ shippingPrice: { $gt: 0 } }), /عدد صحیح/);
  assert.throws(() => cleanShippingSettings(null), /معتبر/);
  // بدون مقدار ذخیره‌شده → پیش‌فرض .env/settings؛ با مقدار ذخیره‌شده (حتی ۰) → همان مقدار
  assert.deepEqual(mergeShipping(null), { shippingPrice: 80000, freeShippingThreshold: 2000000 });
  assert.deepEqual(mergeShipping({ shippingPrice: 0 }), { shippingPrice: 0, freeShippingThreshold: 2000000 });
});
