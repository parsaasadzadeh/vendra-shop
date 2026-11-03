"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import OrderView from "@/components/OrderView";
import { IconCheck } from "@/components/Icons";
import { useCart } from "@/context/Providers";
import { getOrderByToken } from "@/lib/api";

function Content() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const orderNo = sp.get("order") || "";
  const { clear } = useCart();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    clear();
    if (!token) return;
    getOrderByToken(token).then((r) => setOrder(r.order)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="container section-sm narrow">
      <div className="result result-ok">
        <div className="result-icon"><IconCheck size={36} /></div>
        <h1>پرداخت با موفقیت انجام شد</h1>
        <p>
          سفارش شما ثبت شد و به‌زودی آماده‌ی ارسال می‌شود.
          {orderNo && <> شماره سفارش: <b dir="ltr">{orderNo}</b></>}
        </p>
        <p className="muted small">این صفحه را نگه دارید یا از بخش «پیگیری سفارش» وضعیت را ببینید.</p>
      </div>
      {order && <OrderView order={order} token={token} onChange={setOrder} />}
      <div className="center-actions">
        <Link href="/shop" className="btn btn-primary btn-lg">ادامه خرید</Link>
        <Link href="/track" className="btn btn-ghost btn-lg">پیگیری سفارش</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="container section"><div className="skeleton" style={{ height: 240 }} /></div>}>
      <Content />
    </Suspense>
  );
}
