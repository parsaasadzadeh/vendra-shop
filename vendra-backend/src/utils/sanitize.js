// جلوگیری از NoSQL injection و prototype pollution:
// هر کلیدی که با $ شروع شود یا نقطه داشته باشد (یا __proto__ باشد) از ورودی حذف می‌شود
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

const clean = (value, depth = 0) => {
  if (depth > 10 || value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) value[i] = clean(value[i], depth + 1);
    return value;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".") || FORBIDDEN.has(key)) {
      delete value[key];
    } else {
      value[key] = clean(value[key], depth + 1);
    }
  }
  return value;
};

module.exports = clean;
