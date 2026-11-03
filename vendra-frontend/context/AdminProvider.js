"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/Providers";
import { TOKEN_STORAGE_KEY, adminLogin, adminLogout, adminMe, getToken, onUnauthorized, setToken, tokenExpiry } from "@/lib/adminApi";

const AdminCtx = createContext(null);
export const useAdmin = () => useContext(AdminCtx);

export default function AdminProvider({ children }) {
  const router = useRouter();
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [expired, setExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const adminRef = useRef(null);
  adminRef.current = admin;

  // بررسی نشست هنگام باز شدن پنل
  useEffect(() => {
    let alive = true;
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    adminMe()
      .then((res) => {
        if (!alive) return;
        setAdmin(res.admin);
        setExpiresAt(tokenExpiry(token));
      })
      .catch((err) => {
        if (!alive) return;
        // توکن قدیمی/باطل: پاک می‌شود و صفحه‌ی ورود نشان داده می‌شود
        if (err.status === 401) setToken("");
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // هر ۴۰۱ وسط کار = پایان نشست. فرم‌ها باز می‌مانند و پنجره‌ی ورود مجدد نشان داده می‌شود
  useEffect(() => onUnauthorized(() => adminRef.current && setExpired(true)), []);

  // خروج/ورود در تب دیگر
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== TOKEN_STORAGE_KEY) return;
      if (!e.newValue) {
        setAdmin(null);
        setExpired(false);
      } else {
        setExpiresAt(tokenExpiry(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // هشدار پیش از انقضا + نمایش خودکار ورود مجدد وقتی توکن تمام شد
  useEffect(() => {
    if (!admin || !expiresAt) return;
    const now = Date.now();
    const timers = [];
    const warnIn = expiresAt - now - 5 * 60 * 1000;
    if (warnIn > 0) timers.push(setTimeout(() => toast("نشست شما حدود ۵ دقیقه‌ی دیگر تمام می‌شود", "error"), warnIn));
    const expireIn = expiresAt - now;
    if (expireIn > 0) timers.push(setTimeout(() => setExpired(true), expireIn));
    else setExpired(true);
    return () => timers.forEach(clearTimeout);
  }, [admin, expiresAt, toast]);

  const applySession = useCallback((token, profile) => {
    setToken(token);
    setAdmin(profile);
    setExpiresAt(tokenExpiry(token));
    setExpired(false);
  }, []);

  const login = useCallback(
    async (username, password) => {
      const res = await adminLogin(username, password);
      applySession(res.token, res.admin);
      return res.admin;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await adminLogout(); // سرور همه‌ی توکن‌های این ادمین (همه‌ی دستگاه‌ها) را باطل می‌کند
    } catch {
      /* توکن از قبل باطل بوده؛ مهم نیست */
    }
    setToken("");
    setAdmin(null);
    setExpired(false);
    router.replace("/admin/login");
  }, [router]);

  const value = useMemo(
    () => ({ ready, admin, expired, expiresAt, login, logout, applySession }),
    [ready, admin, expired, expiresAt, login, logout, applySession]
  );

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}
