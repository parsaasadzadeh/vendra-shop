const crypto = require("crypto");
const { put, del } = require("@vercel/blob");
const AppError = require("./appError");

// نوع واقعی فایل را از روی بایت‌های ابتدایی تشخیص می‌دهیم (mimetype کلاینت قابل جعل است)
const detectImage = (buf) => {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return { mime: "image/png", ext: "png" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  return null;
};

const uploadFileToBlob = async (file) => {
  const type = detectImage(file.buffer);
  if (!type) throw new AppError("فایل ارسالی یک تصویر معتبر نیست", 400);

  // نام فایل را خودمان می‌سازیم (نام اصلی کاربر استفاده نمی‌شود)
  const name = `products/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${type.ext}`;
  const blob = await put(name, file.buffer, {
    access: "public",
    contentType: type.mime,
    addRandomSuffix: false,
  });
  return blob.url;
};

const deleteFileFromBlob = async (url) => {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    console.error("Blob delete error:", err.message);
  }
};

// اگر یکی از آپلودها شکست بخورد، بقیه پاک می‌شوند تا فایل یتیم نماند
const uploadFilesToBlob = async (files = []) => {
  const results = await Promise.allSettled(files.map(uploadFileToBlob));
  const urls = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const failed = results.find((r) => r.status === "rejected");

  if (failed) {
    await Promise.all(urls.map(deleteFileFromBlob));
    throw failed.reason instanceof AppError
      ? failed.reason
      : new AppError("آپلود تصویر با خطا مواجه شد", 502);
  }
  return urls;
};

module.exports = { uploadFileToBlob, uploadFilesToBlob, deleteFileFromBlob };
