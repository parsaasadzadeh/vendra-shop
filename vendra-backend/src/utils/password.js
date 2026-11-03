const crypto = require("crypto");
const { promisify } = require("util");
const AppError = require("./appError");
const settings = require("../config/settings");

const scrypt = promisify(crypto.scrypt);

// scrypt با نمک تصادفی؛ پارامترها داخل خود هش ذخیره می‌شوند تا بعداً قابل ارتقا باشند
const PARAMS = { N: 2 ** 15, r: 8, p: 3 };
const KEYLEN = 64;
const MAXMEM = 128 * 1024 * 1024;

const derive = (password, salt, { N, r, p }) =>
  scrypt(String(password), salt, KEYLEN, { N, r, p, maxmem: MAXMEM });

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const hash = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), hash.toString("base64")].join("$");
};

const verifyPassword = async (password, stored) => {
  try {
    const [algo, N, r, p, saltB64, hashB64] = String(stored || "").split("$");
    if (algo !== "scrypt") return false;
    const params = { N: Number(N), r: Number(r), p: Number(p) };
    const expected = Buffer.from(hashB64, "base64");
    const actual = await derive(password, Buffer.from(saltB64, "base64"), params);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
};

// هش ساختگی: برای نام‌کاربری ناموجود هم همان زمان محاسبه صرف می‌شود (جلوگیری از timing attack)
let dummyHashPromise = null;
const getDummyHash = () => {
  if (!dummyHashPromise) dummyHashPromise = hashPassword(crypto.randomBytes(16).toString("hex"));
  return dummyHashPromise;
};

const assertStrongPassword = (password, username = "") => {
  const min = settings.admin.minPasswordLength;
  if (typeof password !== "string") throw new AppError("رمز عبور معتبر نیست", 400);
  if (password.length < min) throw new AppError(`رمز عبور باید حداقل ${min} کاراکتر باشد`, 400);
  if (password.length > 128) throw new AppError("رمز عبور بیش از حد طولانی است", 400);
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError("رمز عبور باید هم حرف انگلیسی و هم عدد داشته باشد", 400);
  }
  if (username && password.toLowerCase().includes(String(username).toLowerCase())) {
    throw new AppError("رمز عبور نباید شامل نام کاربری باشد", 400);
  }
};

module.exports = { hashPassword, verifyPassword, getDummyHash, assertStrongPassword };
