const AppError = require("../utils/appError");

/*
  تست:  ZIBAL_MERCHANT=zibal      (مرچنت تستی خود زیبال؛ پول واقعی جابه‌جا نمی‌شود)
  واقعی: ZIBAL_MERCHANT=<مرچنت پنل زیبال>
  هیچ کد دیگری برای رفتن از تست به واقعی عوض نمی‌شود.
*/
const getConfig = () => ({
  base: (process.env.ZIBAL_API_BASE || "https://gateway.zibal.ir").replace(/\/$/, ""),
  merchant: process.env.ZIBAL_MERCHANT,
  callback: process.env.ZIBAL_CALLBACK_URL,
});

const isTestMode = () => process.env.ZIBAL_MERCHANT === "zibal";

const post = async (url, body) => {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    console.error("Zibal network error:", err.message);
    throw new AppError("ارتباط با درگاه پرداخت برقرار نشد", 502);
  }

  try {
    return await res.json();
  } catch {
    throw new AppError("پاسخ نامعتبر از درگاه پرداخت", 502);
  }
};

const zibalRequest = async ({ amountRial, description, mobile, orderId }) => {
  const { base, merchant, callback } = getConfig();
  if (!merchant) throw new AppError("ZIBAL_MERCHANT تنظیم نشده", 500);
  if (!callback) throw new AppError("ZIBAL_CALLBACK_URL تنظیم نشده", 500);

  const data = await post(`${base}/v1/request`, {
    merchant,
    amount: amountRial,
    callbackUrl: callback,
    description,
    mobile,
    orderId,
  });

  if (!data || data.result !== 100 || !data.trackId) {
    console.error("Zibal request failed:", data);
    throw new AppError("خطا در ایجاد تراکنش پرداخت", 400);
  }

  return { trackId: String(data.trackId), paymentUrl: `${base}/start/${data.trackId}` };
};

const zibalVerify = async ({ trackId }) => {
  const { base, merchant } = getConfig();
  const data = await post(`${base}/v1/verify`, { merchant, trackId: Number(trackId) });

  // 100 = موفق ، 201 = قبلاً تایید شده ، 202 = پرداخت نشده
  const ok = data?.result === 100 || data?.result === 201;
  return { ok, data: data || {} };
};

module.exports = { zibalRequest, zibalVerify, isTestMode };
