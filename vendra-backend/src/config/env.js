// بررسی متغیرهای محیطی هنگام بالا آمدن؛ اگر چیزی ناقص باشد برنامه اصلاً بالا نمی‌آید
const validateEnv = () => {
  const env = process.env;
  const isProd = env.NODE_ENV === "production";
  const missing = [];
  const need = (name) => {
    if (!env[name]) missing.push(name);
  };

  need("JWT_SECRET");
  if (!env.MONGODB_URI && !env.MONGO_URI) missing.push("MONGODB_URI");

  if (isProd) {
    ["CORS_ORIGIN", "FRONT_URL", "ZIBAL_MERCHANT", "ZIBAL_CALLBACK_URL", "CRON_SECRET", "BLOB_READ_WRITE_TOKEN"].forEach(need);
  }

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const minSecret = isProd ? 32 : 16;
  if (env.JWT_SECRET.length < minSecret) {
    throw new Error(`JWT_SECRET must be at least ${minSecret} characters`);
  }

  if (isProd) {
    // مرچنت تستی زیبال یعنی «پرداخت بدون پول واقعی»؛ در production فقط با تایید صریح مجاز است
    if (env.ZIBAL_MERCHANT === "zibal" && env.ALLOW_ZIBAL_TEST !== "true") {
      throw new Error("ZIBAL_MERCHANT=zibal is the TEST merchant. Set ALLOW_ZIBAL_TEST=true to allow it in production");
    }
    if (env.CRON_SECRET.length < 16) {
      throw new Error("CRON_SECRET must be at least 16 characters");
    }
  }
};

module.exports = validateEnv;
