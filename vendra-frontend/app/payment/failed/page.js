"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconAlert } from "@/components/Icons";
import { requestPayment } from "@/lib/api";
import { PAYMENT_FAIL_REASONS } from "@/lib/constants";

function Content() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const reason = sp.get("reason") || "";
  const orderNo = sp.get("order") || "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const noRetry = reason === "refund_pending" || reason === "amount_mismatch";

  const retry = async () => {
    setBusy(true);
    setError("");
    try {
      const { paymentUrl } = await requestPayment(token);
      window.location.href = paymentUrl;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="container section narrow">
      <div className="result result-bad">
        <div className="result-icon"><IconAlert size={36} /></div>
        <h1>پرداخت انجام نشد</h1>
        <p>{PAYMENT_FAIL_REASONS[reason] || "پرداخت شما کامل نشد."}</p>
        {orderNo && <p className="muted small">شماره سفارش: <b dir="ltr">{orderNo}</b></p>}
        {!noRetry && token && <p className="muted small">موجودی کالاها برای مدت محدودی برای شما نگه داشته می‌شود؛ می‌توانید دوباره پرداخت کنید.</p>}
        {error && <p className="hint-error">{error}</p>}
        <div className="center-actions">
          {!noRetry && token && (
            <button className="btn btn-primary btn-lg" onClick={retry} disabled={busy}>
              {busy ? "در حال انتقال…" : "تلاش دوباره برای پرداخت"}
            </button>
          )}
          {token && <Link href={`/track/${token}`} className="btn btn-ghost btn-lg">مشاهده سفارش</Link>}
          <Link href="/shop" className="btn btn-ghost btn-lg">بازگشت به فروشگاه</Link>
        </div>
      </div>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={<div className="container section"><div className="skeleton" style={{ height: 240 }} /></div>}>
      <Content />
    </Suspense>
  );
}
