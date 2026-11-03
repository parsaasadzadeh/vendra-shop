const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "خطای داخلی سرور";

  if (err.name === "CastError") {
    statusCode = 400;
    message = "شناسه ارسال شده معتبر نیست";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "این مقدار قبلاً ثبت شده است";
  }

  if (err.name === "VersionError") {
    statusCode = 409;
    message = "اطلاعات هم‌زمان تغییر کرد؛ دوباره تلاش کنید";
  }

  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join("، ");
  }

  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") message = "حجم هر عکس نباید بیشتر از ۴ مگابایت باشد";
    else if (err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT")
      message = "تعداد عکس‌ها بیش از حد مجاز است";
    else message = "خطا در آپلود فایل";
  }

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "فرمت JSON ارسال شده معتبر نیست";
  }

  if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "حجم درخواست بیش از حد مجاز است";
  }

  // خطاهای سروری لاگ می‌شوند و در production جزئیاتشان به کاربر نمی‌رسد
  if (statusCode >= 500) {
    console.error("ERROR:", err);
    // خطای پیش‌بینی‌شده‌ی ارتباط با سرویس بیرونی (درگاه، پیامک، فضای عکس) پیام خودش را نشان می‌دهد
    const exposable = err.isOperational && [502, 503, 504].includes(statusCode);
    if (process.env.NODE_ENV === "production" && !exposable) message = "خطای داخلی سرور";
  }

  const body = { success: false, message };
  // اطلاعات اضافه‌ی پیش‌بینی‌شده (مثلاً کدام آیتم سبد ناموجود است)
  if (err.isOperational && err.details !== undefined && statusCode < 500) body.details = err.details;

  res.status(statusCode).json(body);
};

module.exports = errorMiddleware;
