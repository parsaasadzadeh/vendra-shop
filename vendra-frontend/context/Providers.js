"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_SHIPPING } from "@/lib/shipping";

const CART_KEY = "vendra_cart_v1";
const MAX_QTY = 20;

const CartCtx = createContext(null);
const ToastCtx = createContext(null);
const ShippingCtx = createContext(DEFAULT_SHIPPING);

export const useCart = () => useContext(CartCtx);
export const useToast = () => useContext(ToastCtx);
// { price, freeThreshold } از تنظیمات فروشنده؛ فقط برای نمایش (مبلغ واقعی را /cart/quote حساب می‌کند)
export const useShipping = () => useContext(ShippingCtx);

const keyOf = (i) => `${i.productId}:${i.variantId}`;

export default function Providers({ children, shipping = DEFAULT_SHIPPING }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  // خواندن سبد از مرورگر
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed.filter((i) => i && i.productId && i.variantId && i.quantity > 0));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // ذخیره + هماهنگی بین تب‌ها
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== CART_KEY) return;
      try {
        setItems(e.newValue ? JSON.parse(e.newValue) : []);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toast = useCallback((message, type = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const addItem = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const k = keyOf(item);
      const max = Math.min(item.max || MAX_QTY, MAX_QTY);
      const found = prev.find((i) => keyOf(i) === k);
      if (found) {
        return prev.map((i) => (keyOf(i) === k ? { ...i, ...item, quantity: Math.min(i.quantity + qty, max) } : i));
      }
      return [...prev, { ...item, quantity: Math.min(qty, max) }];
    });
  }, []);

  const setQty = useCallback((productId, variantId, qty) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, quantity: Math.min(Math.max(qty, 0), MAX_QTY) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId, variantId) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
      addItem,
      setQty,
      removeItem,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [items, ready, addItem, setQty, removeItem, clear, drawerOpen]
  );

  return (
    <CartCtx.Provider value={value}>
      <ShippingCtx.Provider value={shipping}>
      <ToastCtx.Provider value={toast}>
        {children}
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
      </ShippingCtx.Provider>
    </CartCtx.Provider>
  );
}
