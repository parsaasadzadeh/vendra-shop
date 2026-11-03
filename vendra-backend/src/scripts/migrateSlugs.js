// پر کردن/یکتا کردن slug محصولات موجود (یک‌بار، قبل از دیپلوی نسخه‌ی جدید)
//
//   node src/scripts/migrateSlugs.js --dry     ← فقط نشان می‌دهد چه تغییری می‌کند
//   node src/scripts/migrateSlugs.js           ← اعمال + ساخت unique index
//
// slug معتبر و یکتای قبلی دست‌نخورده می‌ماند؛ فقط خالی/تکراری/رزروشده‌ها از روی عنوان ساخته می‌شوند.
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");
const { slugify, uniqueSlug, RESERVED_SLUGS } = require("../utils/slug");

const dry = process.argv.includes("--dry");

(async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined");
  await mongoose.connect(mongoUri);

  const products = await Product.find({}).select("title slug").sort("createdAt").lean();
  const used = new Set();
  const changes = [];

  for (const p of products) {
    const current = typeof p.slug === "string" ? p.slug : "";
    const valid = current && current === slugify(current) && !RESERVED_SLUGS.has(current) && !used.has(current);

    if (valid) {
      used.add(current);
      continue;
    }
    const next = await uniqueSlug(p.title, async (c) => used.has(c));
    used.add(next);
    changes.push({ updateOne: { filter: { _id: p._id }, update: { $set: { slug: next } } } });
    console.log(`${dry ? "[dry] " : ""}${String(p._id)}  «${p.title}»  ${current || "(خالی)"} → ${next}`);
  }

  console.log(`\n${products.length} محصول بررسی شد؛ ${changes.length} slug ساخته/اصلاح ${dry ? "می‌شود" : "شد"}.`);

  if (!dry) {
    if (changes.length) await Product.bulkWrite(changes);
    await Product.createIndexes(); // unique index روی slug
    console.log("ایندکس‌ها ساخته شد.");
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
