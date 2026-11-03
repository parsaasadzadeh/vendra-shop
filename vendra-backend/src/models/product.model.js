const mongoose = require("mongoose");
const AppError = require("../utils/appError");

/*
  هر «ترکیب سایز + رنگ» یک variant مستقل با موجودی مخصوص خودش است.
  مثال: سایز L قرمز = ۵ عدد، سایز XL قرمز = ۰ عدد، سایز XL مشکی = ۳ عدد.
  موجودی کل (totalStock) ذخیره نمی‌شود و همیشه از روی variantها محاسبه می‌شود تا هرگز ناهماهنگ نشود.
*/
const variantSchema = new mongoose.Schema({
  size: { type: String, required: [true, "سایز الزامی است"], trim: true, maxlength: 30 },
  colorName: { type: String, trim: true, default: "", maxlength: 40 },
  colorCode: {
    type: String,
    trim: true,
    default: "",
    validate: {
      validator: (v) => v === "" || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v),
      message: "کد رنگ باید به شکل #RRGGBB باشد",
    },
  },
  sku: { type: String, trim: true, default: "", maxlength: 60 },
  stock: {
    type: Number,
    default: 0,
    min: [0, "موجودی نمی‌تواند منفی باشد"],
    validate: { validator: Number.isInteger, message: "موجودی باید عدد صحیح باشد" },
  },
});

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "نام محصول الزامی است"], trim: true, maxlength: 200 },
    // آدرس صفحه‌ی محصول؛ فقط هنگام ساخت از عنوان تولید می‌شود و با ویرایش عنوان عوض نمی‌شود (لینک‌های اینستاگرام و گوگل نشکنند)
    slug: { type: String, trim: true, lowercase: true, maxlength: 100 },
    // slugهای قبلی؛ لینک قدیمی هنوز کار می‌کند و به آدرس جدید ریدایرکت می‌شود
    slugHistory: { type: [String], default: [] },
    description: { type: String, trim: true, default: "", maxlength: 5000 },
    price: { type: Number, required: [true, "قیمت محصول الزامی است"], min: [0, "قیمت نمی‌تواند منفی باشد"] },
    discountPrice: { type: Number, default: 0, min: [0, "قیمت تخفیف نمی‌تواند منفی باشد"] },
    finalPrice: { type: Number, default: 0, min: 0 },
    category: { type: String, trim: true, default: "عمومی", maxlength: 60 },
    brand: { type: String, trim: true, default: "", maxlength: 60 },
    gender: { type: String, enum: ["men", "women", "kids", "unisex"], default: "unisex" },
    variants: { type: [variantSchema], default: [] },
    images: { type: [String], default: [] },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ isPublished: 1, createdAt: -1 });
productSchema.index({ category: 1, gender: 1, finalPrice: 1 });
productSchema.index({ "variants._id": 1 });
productSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $gt: "" } } });
productSchema.index({ slugHistory: 1 });
productSchema.index({ isPublished: 1, isFeatured: 1, createdAt: -1 });

productSchema.virtual("totalStock").get(function () {
  return this.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
});
productSchema.virtual("inStock").get(function () {
  return this.variants.some((v) => v.stock > 0);
});

const variantKey = (v) => `${String(v.size).trim().toLowerCase()}|${String(v.colorName || "").trim().toLowerCase()}`;

productSchema.pre("validate", function () {
  if (this.discountPrice > 0 && this.discountPrice >= this.price) {
    throw new AppError("قیمت تخفیف‌خورده باید کمتر از قیمت اصلی باشد", 400);
  }
  this.finalPrice = this.discountPrice > 0 ? this.discountPrice : this.price;

  const keys = this.variants.map(variantKey);
  if (new Set(keys).size !== keys.length) {
    throw new AppError("ترکیب سایز و رنگ تکراری وارد شده است", 400);
  }
});

module.exports = mongoose.model("Product", productSchema);
