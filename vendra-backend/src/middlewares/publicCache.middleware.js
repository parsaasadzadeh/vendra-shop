// کش کوتاه روی CDN (Vercel) برای مسیرهای عمومیِ فقط‌خواندنی؛ فشار روی دیتابیس را کم می‌کند.
// موجودی نهایی همیشه در /cart/quote و ثبت سفارش از دیتابیس بررسی می‌شود، پس این تأخیر کوتاه خطری ندارد.
const publicCache = (seconds = 30) => (req, res, next) => {
  if (req.method === "GET") res.set("Cache-Control", `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`);
  next();
};

module.exports = publicCache;
