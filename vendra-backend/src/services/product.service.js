const Product = require("../models/product.model");
const Order = require("../models/order.model");
const AppError = require("../utils/appError");
const settings = require("../config/settings");
const { isMongoId, escapeRegex } = require("../utils/validators");
const { getPagination, buildMeta } = require("../utils/pagination");
const { uploadFilesToBlob, deleteFileFromBlob } = require("../utils/blobStorage");
const { uniqueSlug, slugify } = require("../utils/slug");
const { GENDERS, cleanVariant, cleanVariants, cleanProductFields, toInt, MAX_STOCK } = require("../validators/product.validator");

const text = (v) => (typeof v === "string" ? v.trim() : "");
const assertId = (id, message = "شناسه محصول معتبر نیست") => {
  if (!isMongoId(id)) throw new AppError(message, 400);
};

/* ------------------------------------------------------------------ */
/* فروشگاه (عمومی)                                                      */
/* ------------------------------------------------------------------ */

const buildPublicFilter = (q = {}) => {
  const filter = { isPublished: true };

  const search = text(q.search).slice(0, 100);
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

  const category = text(q.category);
  if (category) filter.category = category;

  const gender = text(q.gender);
  if (GENDERS.includes(gender)) filter.gender = gender;

  if (text(q.featured) === "true") filter.isFeatured = true;

  const min = text(q.minPrice) ? Number(q.minPrice) : null;
  const max = text(q.maxPrice) ? Number(q.maxPrice) : null;
  if ((min !== null && Number.isFinite(min)) || (max !== null && Number.isFinite(max))) {
    filter.finalPrice = {};
    if (min !== null && Number.isFinite(min)) filter.finalPrice.$gte = min;
    if (max !== null && Number.isFinite(max)) filter.finalPrice.$lte = max;
  }

  // فیلتر دقیق موجودی: «سایز XL به رنگ قرمز که واقعاً موجود است»
  const size = text(q.size).slice(0, 30);
  const color = text(q.color).slice(0, 40);
  if (size || color || text(q.inStock) === "true") {
    const match = { stock: { $gt: 0 } };
    if (size) match.size = size;
    if (color) match.colorName = color;
    filter.variants = { $elemMatch: match };
  }

  return filter;
};

const SORTS = { price_asc: "finalPrice", price_desc: "-finalPrice", newest: "-createdAt" };

const listPublic = async (query = {}) => {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 12, maxLimit: 50 });
  const filter = buildPublicFilter(query);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(SORTS[text(query.sort)] || "-createdAt").skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { products, ...buildMeta(total, page, limit) };
};

/*
  محصول با slug (برای URL) یا با id (سازگاری با لینک‌های قدیمی).
  اگر slug قدیمی باشد redirected=true برمی‌گردد تا فرانت به آدرس فعلی ریدایرکت کند.
*/
const getPublic = async (idOrSlug) => {
  const key = text(idOrSlug);
  let product;
  let redirected = false;

  if (isMongoId(key)) {
    product = await Product.findById(key).lean();
  } else {
    const slug = slugify(key);
    if (slug) {
      product = await Product.findOne({ slug }).lean();
      if (!product) {
        product = await Product.findOne({ slugHistory: slug }).lean();
        redirected = Boolean(product);
      }
    }
  }

  // محصول پیش‌نویس/آرشیو برای مشتری دیده نمی‌شود
  if (!product || !product.isPublished) throw new AppError("محصول یافت نشد", 404);
  return { product, redirected };
};

const listCategories = () => Product.distinct("category", { isPublished: true });

// برای ساخت sitemap.xml در فرانت
const listSlugs = () => Product.find({ isPublished: true, slug: { $gt: "" } }).select("slug updatedAt").sort("-updatedAt").limit(5000).lean();

/* ------------------------------------------------------------------ */
/* slug                                                                  */
/* ------------------------------------------------------------------ */

// slug هم نباید slug فعلیِ محصول دیگری باشد و هم slug قدیمی‌اش (وگرنه لینک قدیمی را می‌بلعد)
const slugTaken = (slug, excludeId) =>
  Product.exists({ $or: [{ slug }, { slugHistory: slug }], ...(excludeId ? { _id: { $ne: excludeId } } : {}) });

const isDuplicateSlugError = (err) => err && err.code === 11000 && /slug/.test(`${err.message} ${JSON.stringify(err.keyPattern || {})}`);

const duplicateSlugError = () => new AppError("این آدرس (slug) قبلاً برای محصول دیگری استفاده شده است", 409);

/* ------------------------------------------------------------------ */
/* مدیریت محصول (ادمین)                                                  */
/* ------------------------------------------------------------------ */

const createProduct = async (payload = {}, files = []) => {
  const data = { ...cleanProductFields(payload), variants: cleanVariants(payload.variants) };

  if (files.length > settings.maxImagesPerProduct) {
    throw new AppError(`حداکثر ${settings.maxImagesPerProduct} عکس مجاز است`, 400);
  }
  if (data.variants.length > settings.maxVariantsPerProduct) {
    throw new AppError(`حداکثر ${settings.maxVariantsPerProduct} ترکیب سایز/رنگ مجاز است`, 400);
  }

  // قبل از آپلود عکس، سند را اعتبارسنجی می‌کنیم تا عکس بی‌خود آپلود نشود
  const product = new Product(data);
  await product.validate();

  // slug دستیِ ادمین اگر آزاد نبود خطا می‌دهد؛ وگرنه از عنوان ساخته و یکتا می‌شود
  if (data.slug && (await slugTaken(data.slug))) throw duplicateSlugError();

  product.images = await uploadFilesToBlob(files);
  try {
    for (let attempt = 0; ; attempt += 1) {
      if (!data.slug) product.slug = await uniqueSlug(data.title, (c) => slugTaken(c));
      try {
        await product.save();
        break;
      } catch (err) {
        // دو محصول هم‌زمان با یک عنوان: unique index جلوی تکرار را می‌گیرد، یک بار دیگر slug می‌سازیم
        if (!isDuplicateSlugError(err)) throw err;
        if (data.slug) throw duplicateSlugError();
        if (attempt >= 2) throw err;
      }
    }
  } catch (err) {
    await Promise.all(product.images.map(deleteFileFromBlob));
    throw err;
  }
  return product;
};

const listAdmin = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (text(query.search)) filter.title = { $regex: escapeRegex(text(query.search).slice(0, 100)), $options: "i" };
  if (query.isPublished === "true") filter.isPublished = true;
  if (query.isPublished === "false") filter.isPublished = false;
  if (query.outOfStock === "true") filter.variants = { $not: { $elemMatch: { stock: { $gt: 0 } } } };

  const [products, total] = await Promise.all([
    Product.find(filter).sort("-createdAt").skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { products, ...buildMeta(total, page, limit) };
};

const getAdmin = async (id) => {
  assertId(id);
  const product = await Product.findById(id);
  if (!product) throw new AppError("محصول یافت نشد", 404);
  return product;
};

// سایز/رنگ‌ها اینجا تغییر نمی‌کنند (برای جلوگیری از بازنویسی موجودیِ در حال فروش)؛ endpointهای variant جدا هستند
const updateProduct = async (id, payload = {}, files = []) => {
  const product = await getAdmin(id);

  const { slug: newSlug, ...fields } = cleanProductFields(payload, { partial: true });
  Object.assign(product, fields);

  // تغییر slug فقط وقتی ادمین صریحاً بفرستد؛ slug قبلی در تاریخچه می‌ماند تا لینک قدیمی ریدایرکت شود
  if (newSlug && newSlug !== product.slug) {
    if (await slugTaken(newSlug, product._id)) throw duplicateSlugError();
    const history = new Set(product.slugHistory || []);
    if (product.slug) history.add(product.slug);
    history.delete(newSlug);
    product.slugHistory = [...history];
    product.slug = newSlug;
  }

  if (files.length > 0) {
    if (product.images.length + files.length > settings.maxImagesPerProduct) {
      throw new AppError(`حداکثر ${settings.maxImagesPerProduct} عکس برای هر محصول مجاز است`, 400);
    }
    const newImages = await uploadFilesToBlob(files);
    product.images = [...product.images, ...newImages];
    try {
      await product.save();
    } catch (err) {
      await Promise.all(newImages.map(deleteFileFromBlob));
      throw isDuplicateSlugError(err) ? duplicateSlugError() : err;
    }
    return product;
  }

  try {
    await product.save();
  } catch (err) {
    throw isDuplicateSlugError(err) ? duplicateSlugError() : err;
  }
  return product;
};

// اگر محصول در سفارشی بوده، حذف نمی‌شود و فقط پنهان (آرشیو) می‌شود تا سفارش‌های قبلی نشکنند
const deleteProduct = async (id) => {
  const product = await getAdmin(id);
  const usedInOrders = await Order.exists({ "items.product": product._id });

  if (usedInOrders) {
    product.isPublished = false;
    product.isFeatured = false;
    await product.save();
    return { archived: true };
  }

  await product.deleteOne();
  await Promise.all(product.images.map(deleteFileFromBlob));
  return { archived: false };
};

const deleteImage = async (id, imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") throw new AppError("آدرس تصویر الزامی است", 400);
  const product = await getAdmin(id);

  if (!product.images.includes(imageUrl)) throw new AppError("این تصویر متعلق به این محصول نیست", 404);

  product.images = product.images.filter((img) => img !== imageUrl);
  await product.save();
  await deleteFileFromBlob(imageUrl);
  return product;
};

/* ------------------------------------------------------------------ */
/* مدیریت سایز/رنگ و موجودی (ادمین) — همه‌ی تغییرها atomic هستند          */
/* ------------------------------------------------------------------ */

const addVariant = async (productId, payload = {}) => {
  assertId(productId);
  const variant = cleanVariant(payload);

  // ترکیب تکراری و سقف تعداد داخل خود کوئری بررسی می‌شود (بدون race)
  const result = await Product.updateOne(
    {
      _id: productId,
      variants: { $not: { $elemMatch: { size: variant.size, colorName: variant.colorName } } },
      [`variants.${settings.maxVariantsPerProduct - 1}`]: { $exists: false },
    },
    { $push: { variants: variant } }
  );

  if (result.matchedCount !== 1) {
    const exists = await Product.exists({ _id: productId });
    if (!exists) throw new AppError("محصول یافت نشد", 404);
    throw new AppError("این ترکیب سایز و رنگ قبلاً ثبت شده یا سقف تعداد پر شده است", 409);
  }
  return Product.findById(productId);
};

/*
  ویرایش یک variant:
   - stock: مقدار مطلق (موجودی را همین عدد می‌کند)
   - stockDelta: افزایش/کاهش نسبی (روی فروشگاه در حال فروش امن‌تر است؛ هرگز زیر صفر نمی‌رود)
*/
const updateVariant = async (productId, variantId, payload = {}) => {
  assertId(productId);
  assertId(variantId, "شناسه سایز/رنگ معتبر نیست");

  const { stockDelta } = payload;
  const fields = cleanVariant(payload, { partial: true });
  const set = {};
  for (const [key, value] of Object.entries(fields)) set[`variants.$.${key}`] = value;

  if (stockDelta !== undefined && fields.stock !== undefined) {
    throw new AppError("فقط یکی از stock یا stockDelta را ارسال کنید", 400);
  }

  const filter = { _id: productId, "variants._id": variantId };
  const update = { $set: set };

  if (stockDelta !== undefined) {
    const delta = Number(stockDelta);
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_STOCK) {
      throw new AppError("stockDelta باید عدد صحیح غیرصفر باشد", 400);
    }
    if (delta < 0) {
      // شرط «موجودی کافی» و پیدا کردن عنصر با یک $elemMatch (تا عملگر $ دقیقاً به همان عنصر اشاره کند)
      delete filter["variants._id"];
      filter.variants = { $elemMatch: { _id: variantId, stock: { $gte: -delta } } };
    }
    update.$inc = { "variants.$.stock": delta };
  }

  if (Object.keys(set).length === 0 && !update.$inc) throw new AppError("چیزی برای ویرایش ارسال نشده است", 400);
  if (Object.keys(set).length === 0) delete update.$set;

  // تغییر نام/رنگ نباید با ترکیب دیگری تکراری شود
  if (fields.size !== undefined || fields.colorName !== undefined) {
    const current = await Product.findOne({ _id: productId, "variants._id": variantId }, { "variants.$": 1 });
    if (!current) throw new AppError("محصول یا سایز/رنگ یافت نشد", 404);
    const cur = current.variants[0];
    const nextSize = fields.size ?? cur.size;
    const nextColor = fields.colorName ?? cur.colorName;
    const dup = await Product.exists({
      _id: productId,
      variants: { $elemMatch: { _id: { $ne: variantId }, size: nextSize, colorName: nextColor } },
    });
    if (dup) throw new AppError("این ترکیب سایز و رنگ قبلاً ثبت شده است", 409);
  }

  const result = await Product.updateOne(filter, update);
  if (result.matchedCount !== 1) {
    const exists = await Product.exists({ _id: productId, "variants._id": variantId });
    if (!exists) throw new AppError("محصول یا سایز/رنگ یافت نشد", 404);
    throw new AppError("موجودی کافی برای این کاهش وجود ندارد", 409);
  }
  return Product.findById(productId);
};

const removeVariant = async (productId, variantId) => {
  assertId(productId);
  assertId(variantId, "شناسه سایز/رنگ معتبر نیست");

  const result = await Product.updateOne({ _id: productId, "variants._id": variantId }, { $pull: { variants: { _id: variantId } } });
  if (result.matchedCount !== 1) throw new AppError("محصول یا سایز/رنگ یافت نشد", 404);
  return Product.findById(productId);
};

module.exports = {
  listPublic,
  getPublic,
  listCategories,
  listSlugs,
  createProduct,
  listAdmin,
  getAdmin,
  updateProduct,
  deleteProduct,
  deleteImage,
  addVariant,
  updateVariant,
  removeVariant,
  // برای تست
  buildPublicFilter,
  toInt,
};
