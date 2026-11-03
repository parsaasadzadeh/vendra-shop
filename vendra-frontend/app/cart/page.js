"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QtyStepper from "@/components/QtyStepper";
import { IconAlert, IconBag, IconTrash } from "@/components/Icons";
import { useCart, useShipping } from "@/context/Providers";
import { quoteCart } from "@/lib/api";
import { faNum, toman } from "@/lib/format";
import { hasFreeThreshold } from "@/lib/shipping";
import { productPath } from "@/lib/paths";

export default function CartPage() {
  const { items, ready, setQty, removeItem, addItem } = useCart();
  const shipping = useShipping();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const timer = useRef(null);

  const signature = items.map((i) => `${i.productId}:${i.variantId}:${i.quantity}`).join("|");

  const refresh = useCallback(async () => {
    if (items.length === 0) {
      setQuote(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await quoteCart(items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })));
      setQuote(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    if (!ready) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(refresh, 250);
    return () => clearTimeout(timer.current);
  }, [ready, refresh]);

  if (!ready || (loading && !quote && items.length > 0)) {
    return (
      <div className="container section-sm">
        <div className="page-head"><h1>سبد خرید</h1></div>
        <div className="cart-layout">
          <div className="panel"><div className="skeleton" style={{ height: 120, marginBottom: 12 }} /><div className="skeleton" style={{ height: 120 }} /></div>
          <div className="panel"><div className="skeleton" style={{ height: 180 }} /></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty big">
          <IconBag size={56} />
          <h1>سبد خرید شما خالی است</h1>
          <p>چند محصول را به سبد اضافه کنید و برگردید.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">مشاهده محصولات</Link>
        </div>
      </div>
    );
  }

  const lines = quote?.lines || [];
  const byKey = new Map(lines.map((l) => [`${l.productId}:${l.variantId}`, l]));
  const subtotal = quote?.itemsPrice ?? 0;
  // آستانه‌ی «لحظه‌ی» سرور (از quote) دقیق‌تر از مقدار کش‌شده‌ی layout است
  const threshold = quote?.freeShippingThreshold ?? shipping.freeThreshold;
  const showProgress = hasFreeThreshold({ price: shipping.price, freeThreshold: threshold });
  const progress = threshold > 0 ? Math.min((subtotal / threshold) * 100, 100) : 100;
  const remaining = Math.max(threshold - subtotal, 0);

  return (
    <div className="container section-sm">
      <div className="page-head">
        <h1>سبد خرید</h1>
        <p className="muted">{faNum(items.reduce((s, i) => s + i.quantity, 0))} کالا</p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <IconAlert /> <span>{error}</span>
          <button className="link-btn" onClick={refresh}>تلاش دوباره</button>
        </div>
      )}

      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((i) => {
            const l = byKey.get(`${i.productId}:${i.variantId}`);
            const bad = l && !l.ok;
            const price = l?.price ?? i.price;
            const max = l?.available ? Math.max(l.available, 1) : i.max || 20;
            return (
              <li key={`${i.productId}:${i.variantId}`} className={`cart-item ${bad ? "has-issue" : ""}`}>
                <Link href={productPath({ slug: l?.slug || i.slug, productId: i.productId })} className="line-img lg">
                  {(l?.image || i.image) ? <Image src={l?.image || i.image} alt={i.title} fill sizes="120px" /> : <span className="img-fallback">{i.title?.[0]}</span>}
                </Link>
                <div className="cart-item-main">
                  <Link href={productPath({ slug: l?.slug || i.slug, productId: i.productId })} className="line-title">{l?.title || i.title}</Link>
                  <div className="line-variant">
                    {(l?.size || i.size) && <span>سایز {l?.size || i.size}</span>}
                    {(l?.colorName || i.colorName) && (
                      <span className="chip-color"><i style={{ background: l?.colorCode || i.colorCode || "#bbb" }} />{l?.colorName || i.colorName}</span>
                    )}
                  </div>
                  {bad && (
                    <p className="issue">
                      <IconAlert size={16} /> {l.message}
                      {l.code === "INSUFFICIENT_STOCK" && l.available > 0 && (
                        <button className="link-btn" onClick={() => setQty(i.productId, i.variantId, l.available)}>
                          تنظیم روی {faNum(l.available)} عدد
                        </button>
                      )}
                    </p>
                  )}
                  <div className="cart-item-foot">
                    <QtyStepper value={i.quantity} max={max} onChange={(q) => setQty(i.productId, i.variantId, q)} />
                    <div className="cart-item-price">
                      <b className="price">{toman(price * i.quantity)} <small>تومان</small></b>
                      {i.quantity > 1 && <span className="muted small">هر عدد {toman(price)}</span>}
                    </div>
                    <button className="icon-btn" onClick={() => removeItem(i.productId, i.variantId)} aria-label="حذف از سبد">
                      <IconTrash size={20} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="summary panel">
          <h2>خلاصه سفارش</h2>

          {showProgress && (
            <div className="ship-progress">
              <p>
                {remaining > 0 ? (<><b>{toman(remaining)}</b> تومان دیگر تا ارسال رایگان</>) : (<b>🎉 ارسال این سفارش رایگان است</b>)}
              </p>
              <div className="bar"><i style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          <div className="sum-row"><span>جمع کالاها</span><span>{toman(subtotal)} تومان</span></div>
          <div className="sum-row"><span>هزینه ارسال</span><span>{quote ? (quote.shippingPrice ? `${toman(quote.shippingPrice)} تومان` : "رایگان") : "—"}</span></div>
          <div className="sum-row total"><span>مبلغ قابل پرداخت</span><b>{toman(quote?.totalPrice ?? 0)} تومان</b></div>

          {quote && !quote.canCheckout && (
            <p className="hint-error">برای ادامه، کالاهای مشکل‌دار را اصلاح یا حذف کنید.</p>
          )}
          {quote?.canCheckout ? (
            <Link href="/checkout" className="btn btn-primary btn-lg btn-block">ادامه و ثبت سفارش</Link>
          ) : (
            <button className="btn btn-primary btn-lg btn-block" disabled>ادامه و ثبت سفارش</button>
          )}
          <Link href="/shop" className="btn btn-ghost btn-block">ادامه خرید</Link>
        </aside>
      </div>
    </div>
  );
}
