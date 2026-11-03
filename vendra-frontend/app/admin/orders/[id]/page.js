"use client";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Badge, ErrorBox, PageHead } from "@/components/admin/ui";
import { IconArrowLeft, IconRefresh } from "@/components/Icons";
import { useToast } from "@/context/Providers";
import { getOrder, markOrderRefunded, recheckOrderPayment, updateOrderStatus } from "@/lib/adminApi";
import { CANCEL_REASON, ORDER_ACTION_LABEL, ORDER_STATUS, ORDER_TRANSITIONS, PAYMENT_STATUS } from "@/lib/adminConstants";
import { faDate, faNum, toman } from "@/lib/format";

const OUTCOMES = {
  paid: "پرداخت تایید شد",
  already_paid: "این سفارش قبلاً پرداخت شده بود",
  not_paid: "هنوز پرداختی برای این سفارش ثبت نشده است",
  amount_mismatch: "مبلغ پرداختی با مبلغ سفارش یکسان نیست؛ سفارش برای برگشت وجه علامت خورد",
  refund_pending: "پرداخت انجام شده ولی سفارش لغو بود؛ باید پول را برگردانید",
};

export default function AdminOrderPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    let alive = true;
    getOrder(id)
      .then((r) => {
        if (!alive) return;
        setOrder(r.order);
        setTracking(r.order.trackingCode || "");
      })
      .catch((e) => alive && e.status !== 401 && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id]);

  const run = async (key, fn, okMessage) => {
    setBusy(key);
    setError("");
    try {
      const r = await fn();
      if (r.order) {
        setOrder(r.order);
        setTracking(r.order.trackingCode || "");
      }
      if (okMessage) toast(typeof okMessage === "function" ? okMessage(r) : okMessage);
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setBusy("");
    }
  };

  if (!order) {
    return error ? (
      <>
        <Link href="/admin/orders" className="link-btn">بازگشت به سفارش‌ها</Link>
        <ErrorBox>{error}</ErrorBox>
      </>
    ) : (
      <div className="skeleton" style={{ height: 320 }} />
    );
  }

  const next = ORDER_TRANSITIONS[order.orderStatus] || [];
  const paid = order.paymentStatus === "paid";
  const a = order.shippingAddress;
  const canRecheck = order.paymentStatus !== "paid" && order.paymentStatus !== "refunded";

  const changeStatus = (status) => {
    if (status === "cancelled") {
      const msg = paid
        ? "این سفارش پرداخت شده است. با لغو، موجودی آزاد می‌شود و باید پول را به مشتری برگردانید. ادامه می‌دهید؟"
        : "سفارش لغو و موجودی آزاد می‌شود. ادامه می‌دهید؟";
      if (!window.confirm(msg)) return;
    }
    const payload = { orderStatus: status };
    if (status === "shipped" && tracking.trim()) payload.trackingCode = tracking.trim();
    run(`s-${status}`, () => updateOrderStatus(order.id, payload), "وضعیت سفارش بروزرسانی شد");
  };

  const saveTracking = () => run("tracking", () => updateOrderStatus(order.id, { trackingCode: tracking.trim() }), "کد رهگیری ذخیره شد");

  const refund = () => {
    if (!window.confirm("فقط بعد از اینکه واقعاً پول را به مشتری برگرداندید این گزینه را بزنید. ادامه می‌دهید؟")) return;
    run("refund", () => markOrderRefunded(order.id), "برگشت وجه ثبت شد");
  };

  return (
    <>
      <Link href="/admin/orders" className="adm-back">
        <IconArrowLeft size={16} style={{ transform: "scaleX(-1)" }} />
        سفارش‌ها
      </Link>

      <PageHead title={`سفارش ${order.orderNumber}`} subtitle={`ثبت‌شده در ${faDate(order.createdAt)}`}>
        <div className="adm-badges">
          <Badge tone={PAYMENT_STATUS[order.paymentStatus]?.tone}>{PAYMENT_STATUS[order.paymentStatus]?.label}</Badge>
          <Badge tone={ORDER_STATUS[order.orderStatus]?.tone}>{ORDER_STATUS[order.orderStatus]?.label}</Badge>
        </div>
      </PageHead>

      <ErrorBox>{error}</ErrorBox>

      {order.refundRequired && (
        <div className="callout callout-warn" style={{ marginBottom: 16 }}>
          <div>
            <b>نیازمند برگشت وجه</b>
            <p className="small muted">پول از مشتری گرفته شده ولی این سفارش فعال نیست.{!(paid && order.orderStatus === "cancelled") && " ابتدا سفارش باید لغو شود."}</p>
          </div>
          {paid && order.orderStatus === "cancelled" && (
            <button className="btn btn-dark btn-sm" onClick={refund} disabled={busy === "refund"}>
              ثبت برگشت وجه
            </button>
          )}
        </div>
      )}

      <div className="adm-two">
        <div className="adm-col">
          <section className="panel">
            <h2>اقلام سفارش</h2>
            <ul className="adm-items">
              {order.items.map((i) => (
                <li key={`${i.productId}-${i.variantId}`}>
                  <div className="mini-img">
                    {i.image ? <Image src={i.image} alt="" fill sizes="52px" style={{ objectFit: "cover", borderRadius: 10 }} /> : null}
                    <b>{faNum(i.quantity)}</b>
                  </div>
                  <div className="grow">
                    <Link href={`/admin/products/${i.productId}`} className="adm-link">{i.title}</Link>
                    <div className="muted small adm-variant">
                      <span>سایز {i.size}</span>
                      {i.colorName && (
                        <span className="chip-color">
                          <i style={{ background: i.colorCode || "#ccc" }} />
                          {i.colorName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="adm-item-price">
                    <b>{toman(i.totalPrice)}</b>
                    <small className="muted">{toman(i.price)} × {faNum(i.quantity)}</small>
                  </div>
                </li>
              ))}
            </ul>
            <div className="totals">
              <div className="sum-row"><span>جمع کالاها</span><b>{toman(order.itemsPrice)}</b></div>
              <div className="sum-row"><span>هزینه ارسال</span><b>{order.shippingPrice ? toman(order.shippingPrice) : "رایگان"}</b></div>
              <div className="sum-row"><span><b>مبلغ کل (تومان)</b></span><b>{toman(order.totalPrice)}</b></div>
            </div>
          </section>

          <section className="panel">
            <h2>مشتری و آدرس</h2>
            <dl className="info-list">
              <div><dt>نام</dt><dd>{order.customer.fullName}</dd></div>
              <div><dt>موبایل</dt><dd dir="ltr" style={{ textAlign: "right" }}>{order.customer.phone}</dd></div>
              <div><dt>آدرس</dt><dd>{a.province}، {a.city}، {a.fullAddress}، پلاک {a.plaque}{a.unit ? `، واحد ${a.unit}` : ""}</dd></div>
              <div><dt>کد پستی</dt><dd dir="ltr" style={{ textAlign: "right" }}>{a.postalCode}</dd></div>
              {order.note && <div><dt>یادداشت مشتری</dt><dd>{order.note}</dd></div>}
            </dl>
          </section>
        </div>

        <div className="adm-col">
          <section className="panel">
            <h2>تغییر وضعیت</h2>
            {next.length === 0 ? (
              <p className="muted">این سفارش در وضعیت نهایی است و دیگر تغییر نمی‌کند.</p>
            ) : (
              <>
                {!paid && next.some((s) => s !== "cancelled") && (
                  <p className="hint-warn small" style={{ marginBottom: 10 }}>تا پرداخت انجام نشود، سفارش را نمی‌شود به مرحله‌ی بعد برد.</p>
                )}
                {(next.includes("shipped") || order.orderStatus === "processing") && (
                  <label className="field" style={{ marginBottom: 12 }}>
                    <span>کد رهگیری پست (اختیاری)</span>
                    <input dir="ltr" value={tracking} maxLength={100} onChange={(e) => setTracking(e.target.value)} placeholder="مثلاً 2450123456789012345" />
                  </label>
                )}
                <div className="adm-actions">
                  {next.map((s) => (
                    <button
                      key={s}
                      className={`btn btn-sm ${s === "cancelled" ? "btn-ghost btn-danger" : "btn-primary"}`}
                      disabled={!!busy || (s !== "cancelled" && !paid)}
                      onClick={() => changeStatus(s)}
                    >
                      {busy === `s-${s}` ? "…" : ORDER_ACTION_LABEL[s]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          {(order.orderStatus === "shipped" || order.orderStatus === "delivered" || order.trackingCode) && (
            <section className="panel">
              <h2>کد رهگیری</h2>
              <div className="adm-inline">
                <input dir="ltr" value={tracking} maxLength={100} onChange={(e) => setTracking(e.target.value)} aria-label="کد رهگیری" />
                <button className="btn btn-ghost btn-sm" onClick={saveTracking} disabled={!!busy || tracking.trim() === (order.trackingCode || "")}>
                  ذخیره
                </button>
              </div>
            </section>
          )}

          <section className="panel">
            <h2>پرداخت</h2>
            <dl className="info-list">
              <div><dt>درگاه</dt><dd>{order.paymentGateway.name || "—"}</dd></div>
              {order.paidAt && <div><dt>زمان پرداخت</dt><dd>{faDate(order.paidAt)}</dd></div>}
              {order.paymentGateway.refNumber && <div><dt>شماره مرجع</dt><dd dir="ltr" style={{ textAlign: "right" }}>{order.paymentGateway.refNumber}</dd></div>}
              {order.paymentGateway.paidTrackId && <div><dt>trackId پرداخت‌شده</dt><dd dir="ltr" style={{ textAlign: "right" }}>{order.paymentGateway.paidTrackId}</dd></div>}
              {order.paymentGateway.trackIds.length > 0 && <div><dt>تراکنش‌های شروع‌شده</dt><dd dir="ltr" style={{ textAlign: "right" }}>{order.paymentGateway.trackIds.join("، ")}</dd></div>}
              {order.cancelReason && <div><dt>دلیل لغو</dt><dd>{CANCEL_REASON[order.cancelReason] || order.cancelReason}</dd></div>}
              {order.deliveredAt && <div><dt>زمان تحویل</dt><dd>{faDate(order.deliveredAt)}</dd></div>}
            </dl>
            {canRecheck && (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!!busy}
                  onClick={() => run("recheck", () => recheckOrderPayment(order.id), (r) => OUTCOMES[r.outcome] || "بررسی انجام شد")}
                >
                  <IconRefresh size={16} />
                  {busy === "recheck" ? "در حال بررسی…" : "استعلام مجدد از درگاه"}
                </button>
                <p className="muted small" style={{ marginTop: 8 }}>اگر مشتری می‌گوید پرداخت کرده ولی سفارش پرداخت‌نشده مانده، این دکمه را بزنید.</p>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
