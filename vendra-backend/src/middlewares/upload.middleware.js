const multer = require("multer");
const AppError = require("../utils/appError");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new AppError("فقط فرمت‌های jpg, jpeg, png, webp مجاز هستند", 400));
};

// نکته: روی Vercel کل بدنه‌ی درخواست حداکثر حدود ۴٫۵ مگابایت می‌تواند باشد.
// پس فرانت باید عکس‌ها را قبل از ارسال فشرده کند (مثلاً زیر ۱ مگابایت) و ترجیحاً چندتا چندتا بفرستد.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB
  },
});

module.exports = upload;
