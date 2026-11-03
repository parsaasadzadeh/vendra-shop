// پاسخ‌های پنل مدیریت هرگز نباید در کش مرورگر/پروکسی بمانند
const noStore = (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  next();
};

module.exports = noStore;
