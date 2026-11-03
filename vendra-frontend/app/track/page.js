"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import OrderView, { statusInfo } from "@/components/OrderView";
import { lookupOrder, getOrderByToken } from "@/lib/api";
import { faDate, toEnDigits, toman } from "@/lib/format";
import { getSavedOrders, removeSavedOrder } from "@/lib/storage";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const list = getSavedOrders();
    setSaved(list.map((o) => ({ ...o })));
    list.slice(0, 5).forEach((o) => {
      getOrderByToken(o.token)
        .then((r) => setSaved((s) => s.map((x) => (x.token === o.token ? { ...x, order: r.order } : x))))
        .catch((e) => {
          if (e.status === 404) {
            removeSavedOrder(o.token);
            setSaved((s) => s.filter((x) => x.token !== o.token));
          }
        });
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!orderNumber.trim() || !phone.trim()) return setError("شماره سفارش و شماره موبایل را وارد کنید.");
    setBusy(true);
    try {
      const { order } = await lookupOrder({ orderNumber: toEnDigits(orderNumber).trim(), phone: toEnDigits(phone).trim() });
      setResult(order);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="container section-sm narrow">
      <div className="page-head">
        <h1>پیگیری سفارش</h1>
        <p className="muted">شماره سفارش و موبایلی که با آن خرید کرده‌اید را وارد کنید.</p>
      </div>

      <form className="panel form-grid" onSubmit={submit} noValidate>
        <label className="field">
          <span>شماره سفارش</span>
          <input dir="ltr" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="مثلاً ORD-123456" />
        </label>
        <label className="field">
          <span>شماره موبایل</span>
          <input dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" />
        </label>
        {error && <p className="hint-error wide" role="alert">{error}</p>}
        <button className="btn btn-primary btn-lg btn-block wide" disabled={busy}>{busy ? "در حال جستجو…" : "پیگیری سفارش"}</button>
      </form>

      {result && (
        <div style={{ marginTop: 24 }}>
          <OrderView order={result} token={null} />
        </div>
      )}

      {saved.length > 0 && (
        <section className="section-sm">
          <h2 className="h3">سفارش‌های اخیر شما در این دستگاه</h2>
          <ul className="saved-list">
            {saved.map((o) => {
              const info = o.order ? statusInfo(o.order) : null;
              return (
                <li key={o.token}>
                  <Link href={`/track/${o.token}`} className="saved-item">
                    <div>
                      <b dir="ltr">{o.orderNumber}</b>
                      <span className="muted small">{faDate(o.createdAt)}</span>
                    </div>
                    <div className="saved-end">
                      <span>{toman(o.order?.totalPrice ?? o.totalPrice)} تومان</span>
                      {info && <span className={`status status-${info.tone}`}>{info.label}</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
