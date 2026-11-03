import { DEFAULT_SHIPPING } from "./shipping";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, revalidate } = {}) {
  const init = {
    method,
    headers: { Accept: "application/json" },
  };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  if (method === "GET" && typeof revalidate === "number") init.next = { revalidate };
  else if (method === "GET" && typeof window === "undefined") init.cache = "no-store";

  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, init);
  } catch {
    throw new ApiError("ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* پاسخ غیر JSON */
  }
  if (!res.ok || (data && data.success === false)) {
    throw new ApiError(data?.message || "خطایی رخ داد. دوباره تلاش کنید.", res.status, data?.details);
  }
  return data;
}

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

/* ---------- فروشگاه (قابل کش در سرور) ---------- */
export const getProducts = (params, revalidate = 60) => request(`/products${qs(params)}`, { revalidate });
// slug یا id (لینک‌های قدیمی). اگر slug قدیمی باشد پاسخ redirected=true دارد.
export const getProduct = (slugOrId, revalidate = 30) => request(`/products/${encodeURIComponent(slugOrId)}`, { revalidate });
export const getProductSlugs = (revalidate = 3600) => request(`/products/slugs`, { revalidate });
export const getCategories = (revalidate = 300) => request(`/products/categories`, { revalidate });

// سایزها/رنگ‌ها/بازه‌ی قیمت برای فیلترها (از روی محصولات منتشرشده ساخته می‌شود)
export async function getFacets() {
  try {
    const { products } = await getProducts({ limit: 50 }, 300);
    const sizes = new Set();
    const colors = new Map();
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      min = Math.min(min, p.finalPrice);
      max = Math.max(max, p.finalPrice);
      p.options?.sizes?.forEach((s) => sizes.add(s.size));
      p.options?.colors?.forEach((c) => !colors.has(c.name) && colors.set(c.name, c.code));
    }
    const order = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];
    const sortedSizes = [...sizes].sort((a, b) => {
      const ia = order.indexOf(a.toUpperCase());
      const ib = order.indexOf(b.toUpperCase());
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b, "en", { numeric: true });
    });
    return {
      sizes: sortedSizes,
      colors: [...colors].map(([name, code]) => ({ name, code })),
      min: Number.isFinite(min) ? min : 0,
      max,
    };
  } catch {
    return { sizes: [], colors: [], min: 0, max: 0 };
  }
}

// هزینه‌ی ارسال از تنظیمات فروشنده (پنل). اگر بک‌اند در دسترس نبود پیش‌فرض برمی‌گردد.
export async function getShipping(revalidate = 30) {
  try {
    const { shipping } = await request(`/settings`, { revalidate });
    return { price: Number(shipping.price), freeThreshold: Number(shipping.freeThreshold) };
  } catch {
    return DEFAULT_SHIPPING;
  }
}

/* ---------- سبد، سفارش، پرداخت (سمت مرورگر) ---------- */
export const quoteCart = (items) => request(`/cart/quote`, { method: "POST", body: { items } });
export const createOrder = (payload) => request(`/orders`, { method: "POST", body: payload });
export const getOrderByToken = (token) => request(`/orders/track/${encodeURIComponent(token)}`);
export const cancelOrder = (token) => request(`/orders/track/${encodeURIComponent(token)}/cancel`, { method: "POST" });
export const lookupOrder = (payload) => request(`/orders/lookup`, { method: "POST", body: payload });
export const requestPayment = (trackingToken) =>
  request(`/payments/zibal/request`, { method: "POST", body: { trackingToken } });
