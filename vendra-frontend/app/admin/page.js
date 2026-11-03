"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, ErrorBox, PageHead } from "@/components/admin/ui";
import { getShippingSettings, listOrders, listProducts } from "@/lib/adminApi";
import { IconTruck } from "@/components/Icons";
import { shippingMessage } from "@/lib/shipping";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/adminConstants";
import { faDate, faNum, toman } from "@/lib/format";

const Stat = ({ href, label, value, tone, hint }) => (
  <Link href={href} className={`adm-stat ${tone ? `tone-${tone}` : ""}`}>
    <span className="adm-stat-label">{label}</span>
    <b className="adm-stat-value">{value === null ? "…" : faNum(value)}</b>
    {hint && <small className="muted">{hint}</small>}
  </Link>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    // فقط «total» هر لیست لازم است؛ پس limit=1
    Promise.all([
      listOrders({ orderStatus: "pending", paymentStatus: "paid", limit: 1 }),
      listOrders({ orderStatus: "processing", limit: 1 }),
      listOrders({ refundRequired: "true", limit: 1 }),
      listProducts({ limit: 1 }),
      listProducts({ outOfStock: "true", limit: 1 }),
      listProducts({ isPublished: "false", limit: 1 }),
      listOrders({ limit: 6 }),
      getShippingSettings(),
    ])
      .then(([paid, processing, refund, products, out, hidden, recent, shipping]) => {
        if (!alive) return;
        setData({
          paid: paid.total,
          processing: processing.total,
          refund: refund.total,
          products: products.total,
          out: out.total,
          hidden: hidden.total,
          recent: recent.orders,
          shipping: shipping.settings,
        });
      })
      .catch((e) => alive && e.status !== 401 && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const d = data || {};
  const val = (k) => (data ? d[k] : null);

  return (
    <>
      <PageHead title="داشبورد" subtitle="خلاصه‌ی وضعیت فروشگاه">
        <Link href="/admin/products/new" className="btn btn-primary">
          + محصول جدید
        </Link>
      </PageHead>
      <ErrorBox>{error}</ErrorBox>

      {data?.shipping && (
        <Link href="/admin/shipping" className="adm-ship-strip">
          <IconTruck size={22} />
          <div className="grow">
            <small>هزینه‌ی ارسال فعلی</small>
            <b>
              {d.shipping.shippingPrice > 0 ? `${toman(d.shipping.shippingPrice)} تومان` : "رایگان"}
              {d.shipping.shippingPrice > 0 && d.shipping.freeShippingThreshold > 0 ? ` — ارسال رایگان از ${toman(d.shipping.freeShippingThreshold)} تومان` : ""}
            </b>
          </div>
          <span className="btn btn-ghost btn-sm">تغییر</span>
        </Link>
      )}

      <section className="adm-stats" aria-label="خلاصه سفارش‌ها">
        <Stat href="/admin/orders?orderStatus=pending&paymentStatus=paid" label="پرداخت‌شده، منتظر پردازش" value={val("paid")} tone={d.paid > 0 ? "warn" : ""} hint="باید پردازش شوند" />
        <Stat href="/admin/orders?orderStatus=processing" label="در حال پردازش" value={val("processing")} hint="آماده‌ی ارسال" />
        <Stat href="/admin/orders?refundRequired=true" label="نیازمند برگشت وجه" value={val("refund")} tone={d.refund > 0 ? "danger" : ""} hint="پول گرفته شده ولی سفارش فعال نیست" />
      </section>

      <section className="adm-stats" aria-label="خلاصه محصولات">
        <Stat href="/admin/products" label="کل محصولات" value={val("products")} />
        <Stat href="/admin/products?outOfStock=true" label="ناموجود" value={val("out")} tone={d.out > 0 ? "warn" : ""} hint="همه‌ی سایز/رنگ‌ها صفر" />
        <Stat href="/admin/products?isPublished=false" label="پنهان / پیش‌نویس" value={val("hidden")} />
      </section>

      <section className="panel">
        <div className="adm-panel-head">
          <h2>آخرین سفارش‌ها</h2>
          <Link href="/admin/orders" className="link-btn">
            همه‌ی سفارش‌ها
          </Link>
        </div>
        {!data ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : d.recent.length === 0 ? (
          <p className="muted">هنوز سفارشی ثبت نشده است.</p>
        ) : (
          <ul className="adm-rows">
            {d.recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="adm-row">
                  <div className="grow">
                    <b dir="ltr" style={{ display: "inline-block" }}>{o.orderNumber}</b>
                    <div className="muted small">
                      {o.customer.fullName} · {faDate(o.createdAt)}
                    </div>
                  </div>
                  <b>{toman(o.totalPrice)} تومان</b>
                  <div className="adm-badges">
                    <Badge tone={PAYMENT_STATUS[o.paymentStatus]?.tone}>{PAYMENT_STATUS[o.paymentStatus]?.label}</Badge>
                    <Badge tone={ORDER_STATUS[o.orderStatus]?.tone}>{ORDER_STATUS[o.orderStatus]?.label}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
