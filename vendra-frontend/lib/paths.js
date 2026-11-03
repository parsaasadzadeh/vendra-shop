// آدرس صفحه‌ی محصول؛ اگر slug نبود (محصولِ مهاجرت‌نشده یا آیتم قدیمیِ سبد) با id می‌رود
// و صفحه‌ی محصول خودش به آدرس slug ریدایرکت می‌کند.
export const productPath = (p) => `/product/${encodeURIComponent(p?.slug || p?.id || p?.productId || "")}`;
