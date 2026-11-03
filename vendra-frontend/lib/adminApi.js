import { API_URL, ApiError } from "@/lib/api";

const TOKEN_KEY = "vendra_admin_token_v1";
const listeners = new Set();

/* ---------- توکن ---------- */
export const getToken = () => {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};
export const setToken = (token) => {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};
export const TOKEN_STORAGE_KEY = TOKEN_KEY;

// زمان انقضای JWT (میلی‌ثانیه) فقط برای نمایش؛ اعتبار واقعی را سرور بررسی می‌کند
export const tokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

// وقتی هر درخواستی ۴۰۱ بگیرد، پنل می‌فهمد نشست تمام شده است
export const onUnauthorized = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

async function request(path, { method = "GET", body, form, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  const init = { method, headers, cache: "no-store" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (form) {
    init.body = form; // Content-Type را مرورگر با boundary درست می‌گذارد
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}/api/admin${path}`, init);
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
    const err = new ApiError(data?.message || "خطایی رخ داد. دوباره تلاش کنید.", res.status, data?.details);
    // ۴۰۱ در خود صفحه‌ی ورود یعنی رمز اشتباه، نه پایان نشست
    if (res.status === 401 && auth) listeners.forEach((fn) => fn(err));
    throw err;
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

/* ---------- احراز هویت ---------- */
export const adminLogin = (username, password) => request("/auth/login", { method: "POST", body: { username, password }, auth: false });
export const adminMe = () => request("/auth/me");
export const adminLogout = () => request("/auth/logout", { method: "POST" });
export const adminChangePassword = (currentPassword, newPassword) =>
  request("/auth/password", { method: "PATCH", body: { currentPassword, newPassword } });

/* ---------- محصولات ---------- */
export const listProducts = (params) => request(`/products${qs(params)}`);
export const getProduct = (id) => request(`/products/${id}`);
export const createProduct = (form) => request("/products", { method: "POST", form });
export const updateProduct = (id, payload) =>
  payload instanceof FormData ? request(`/products/${id}`, { method: "PATCH", form: payload }) : request(`/products/${id}`, { method: "PATCH", body: payload });
export const deleteProduct = (id) => request(`/products/${id}`, { method: "DELETE" });
export const deleteProductImage = (id, imageUrl) => request(`/products/${id}/delete-image`, { method: "PATCH", body: { imageUrl } });
export const addVariant = (id, variant) => request(`/products/${id}/variants`, { method: "POST", body: variant });
export const updateVariant = (id, variantId, patch) => request(`/products/${id}/variants/${variantId}`, { method: "PATCH", body: patch });
export const removeVariant = (id, variantId) => request(`/products/${id}/variants/${variantId}`, { method: "DELETE" });

/* ---------- سفارش‌ها ---------- */
export const listOrders = (params) => request(`/orders${qs(params)}`);
export const getOrder = (id) => request(`/orders/${id}`);
export const updateOrderStatus = (id, payload) => request(`/orders/${id}/status`, { method: "PATCH", body: payload });
export const markOrderRefunded = (id) => request(`/orders/${id}/payment`, { method: "PATCH", body: { paymentStatus: "refunded" } });
export const recheckOrderPayment = (id) => request(`/orders/${id}/recheck-payment`, { method: "POST" });
export const releaseExpiredOrders = () => request("/orders/release-expired", { method: "POST" });

/* ---------- تنظیمات فروشگاه ---------- */
export const getShippingSettings = () => request("/settings");
export const updateShippingSettings = (payload) => request("/settings", { method: "PATCH", body: payload });
