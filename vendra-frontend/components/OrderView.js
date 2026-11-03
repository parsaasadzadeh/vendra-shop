"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cancelOrder, requestPayment } from "@/lib/api";
import { faDate, faNum, toman } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { useToast } from "@/context/Providers";
import { IconCheck } from "./Icons";

const STEPS = [
  { key: "pending", label: "ثبت سفارش" },
  { key: "processing", label: "در حال آماده‌سازی" },
  { key: "shipped", label: "ارسال شد" },
  { key: "delivered", label: "تحویل شد" },
];

export const statusInfo = (o) => {
  if (o.orderStatus === "cancelled") return { label: "لغو شده", tone: "danger" };
  if (o.orderStatus === "delivered") return { label: "تحویل شده", tone: "success" };
  if (o.orderStatus === "shipped") return { label: "ارسال شده", tone: "info" };
  if (o.orderStatus === "processing") return { label: "در حال آماده‌سازی", tone: "info" };
  if (o.paymentStatus === "paid") return { label: "پرداخت شد؛ در حال بررسی", tone: "success" };
  return { label: "در انتظار پرداخت", tone: "warn" };
};

const PAY_LABEL = { pending: "پرداخت نشده", paid: "پرداخت شده", failed: "ناموفق", refunded: "برگشت وجه شد" };

export default function OrderView({ order, token, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const info = statusInfo(order);
  const stepIndex = Math.max(STEPS.findIndex((s) => s.key === order.orderStatus), 0);
  const cancelled = order.orderStatus === "cancelled";
  const a = order.shippingAddress || {};

  const pay = async () => {
    setBusy("pay");
    try {
      const { paymentUrl } = await requestPayment(token);
      window.location.href = paymentUrl;
    } catch (e) {
      toast(e.message, "error");
      setBusy("");
    }
  };

  const cancel = async () => {
    if (!window.confirm("از لغو این سفارش مطمئنید؟")) return;
    setBusy("cancel");
    try {
      const { order: next } = await cancelOrder(token);
      toast("سفارش لغو شد");
      onChange?.(next);
    } catch (e) {
      toast(e.message, "error");
    }
    setBusy("");
  };

  return (
    <div className="order">
      <div className="order-head">
        <div>
          <span className="muted small">شماره سفارش</span>
          <h2 className="order-no" dir="ltr">{order.orderNumber}</h2>
          <span className="muted small">ثبت شده در {faDate(order.createdAt)}</span>
        </div>
        <div className="order-badges">
          <span className={`status status-${info.tone}`}>{info.label}</span>
          <span className={`status status-${order.paymentStatus === "paid" ? "success" : order.paymentStatus === "failed" ? "danger" : "warn"}`}>
            {PAY_LABEL[order.paymentStatus] || order.paymentStatus}
          </span>
        </div>
      </div>

      {!cancelled && (
        <ol className="timeline" aria-label="وضعیت سفارش">
          {STEPS.map((s, i) => (
            <li key={s.key} className={i <= stepIndex ? "done" : ""}>
              <span className="dot">{i <= stepIndex && <IconCheck size={14} />}</span>
              <span className="t-label">{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {order.trackingCode && (
        <div className="callout">
          <span>کد رهگیری مرسوله پستی</span>
          <b dir="ltr">{order.trackingCode}</b>
        </div>
      )}

      {order.canPay && token && (
        <div className="callout callout-warn">
          <div>
            <b>این سفارش هنوز پرداخت نشده است</b>
            {order.expiresAt && <p className="small">موجودی کالا تا {faDate(order.expiresAt)} برای شما نگه داشته می‌شود.</p>}
          </div>
          <button className="btn btn-primary" onClick={pay} disabled={!!busy}>
            {busy === "pay" ? "در حال انتقال…" : "پرداخت سفارش"}
          </button>
        </div>
      )}

      <div className="order-grid">
        <section className="panel">
          <h3>کالاها</h3>
          <ul className="order-items">
            {order.items.map((i) => (
              <li key={`${i.productId}-${i.variantId}`}>
                <Link href={productPath(i)} className="line-img sm">
                  {i.image ? <Image src={i.image} alt={i.title} fill sizes="64px" /> : <span className="img-fallback">{i.title?.[0]}</span>}
                </Link>
                <div className="grow">
                  <b>{i.title}</b>
                  <div className="line-variant">
                    {i.size && <span>سایز {i.size}</span>}
                    {i.colorName && (
                      <span className="chip-color">
                        <i style={{ background: i.colorCode || "#bbb" }} />
                        {i.colorName}
                      </span>
                    )}
                    <span>{faNum(i.quantity)} عدد</span>
                  </div>
                </div>
                <b className="price">{toman(i.totalPrice)}</b>
              </li>
            ))}
          </ul>
          <div className="totals">
            <div className="sum-row"><span>جمع کالاها</span><span>{toman(order.itemsPrice)} تومان</span></div>
            <div className="sum-row"><span>هزینه ارسال</span><span>{order.shippingPrice ? `${toman(order.shippingPrice)} تومان` : "رایگان"}</span></div>
            <div className="sum-row total"><span>مبلغ کل</span><b>{toman(order.totalPrice)} تومان</b></div>
          </div>
        </section>

        <section className="panel">
          <h3>اطلاعات ارسال</h3>
          <dl className="info-list">
            <div><dt>گیرنده</dt><dd>{order.customer?.fullName}</dd></div>
            <div><dt>موبایل</dt><dd dir="ltr">{order.customer?.phone}</dd></div>
            <div><dt>آدرس</dt><dd>{[a.province, a.city, a.fullAddress, a.plaque && `پلاک ${a.plaque}`, a.unit && `واحد ${a.unit}`].filter(Boolean).join("، ")}</dd></div>
            <div><dt>کد پستی</dt><dd dir="ltr">{a.postalCode}</dd></div>
            {order.note && <div><dt>توضیحات</dt><dd>{order.note}</dd></div>}
          </dl>
          {order.canCancel && token && (
            <button className="btn btn-ghost btn-danger btn-block" onClick={cancel} disabled={!!busy}>
              {busy === "cancel" ? "در حال لغو…" : "لغو سفارش"}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
