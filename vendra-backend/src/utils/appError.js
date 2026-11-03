class AppError extends Error {
  // details: اطلاعات اضافه برای فرانت (مثلاً لیست آیتم‌های ناموجود سبد خرید)
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // خطای پیش‌بینی‌شده (نه باگ)
    if (details !== undefined) this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
