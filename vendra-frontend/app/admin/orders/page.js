"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPager, Badge, ErrorBox, PageHead, TableSkeleton, useDebounced } from "@/components/admin/ui";
import { IconRefresh, IconSearch } from "@/components/Icons";
import { useToast } from "@/context/Providers";
import { listOrders, releaseExpiredOrders } from "@/lib/adminApi";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/adminConstants";
import { faDate, faNum, toEnDigits, toman } from "@/lib/format";

const TABS = [{ value: "", label: "همه" }, ...Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label }))];

function OrdersInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();

  const orderStatus = sp.get("orderStatus") || "";
  const paymentStatus = sp.get("paymentStatus") || "";
  const refundRequired = sp.get("refundRequired") === "true";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, orders: [], total: 0, pages: 1, error: "" });
  const [releasing, setReleasing] = useState(false);
  const q = useDebounced(search.trim());

  const setFilter = useCallback(
    (patch) => {
      const next = new URLSearchParams(sp.toString());
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      const s = next.toString();
      router.replace(s ? `/admin/orders?${s}` : "/admin/orders");
      setPage(1);
    },
    [sp, router]
  );

  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    listOrders({ orderStatus, paymentStatus, refundRequired: refundRequired ? "true" : "", search: toEnDigits(q), page, limit: 20 })
      .then((r) => alive && setState({ loading: false, orders: r.orders, total: r.total, pages: r.pages, error: "" }))
      .catch((e) => alive && setState((s) => ({ ...s, loading: false, error: e.status === 401 ? "" : e.message })));
    return () => {
      alive = false;
    };
  }, [orderStatus, paymentStatus, refundRequired, q, page]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [q]);

  const release = async () => {
    if (!window.confirm("سفارش‌های پرداخت‌نشده‌ای که مهلتشان تمام شده لغو و موجودی‌شان آزاد می‌شود. ادامه می‌دهید؟")) return;
    setReleasing(true);
    try {
      const r = await releaseExpiredOrders();
      toast(`${faNum(r.released)} سفارش منقضی آزاد شد`);
      load();
    } catch (e) {
      if (e.status !== 401) toast(e.message, "error");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <>
      <PageHead title="سفارش‌ها" subtitle={state.loading ? "" : `${faNum(state.total)} سفارش`}>
        <button className="btn btn-ghost btn-sm" onClick={release} disabled={releasing} title="لغو سفارش‌های پرداخت‌نشده‌ی منقضی و آزاد کردن موجودی">
          <IconRefresh size={16} />
          {releasing ? "در حال انجام…" : "آزادسازی سفارش‌های منقضی"}
        </button>
      </PageHead>

      <div className="tabs" role="tablist" aria-label="وضعیت سفارش">
        {TABS.map((t) => (
          <button key={t.value} role="tab" aria-selected={orderStatus === t.value} className={`tab ${orderStatus === t.value ? "active" : ""}`} onClick={() => setFilter({ orderStatus: t.value })}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="adm-filters">
        <form className="search adm-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <IconSearch size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="شماره سفارش، موبایل یا نام مشتری" aria-label="جستجو" />
        </form>
        <div className="select-wrap">
          <select value={paymentStatus} onChange={(e) => setFilter({ paymentStatus: e.target.value })} aria-label="وضعیت پرداخت">
            <option value="">همه‌ی پرداخت‌ها</option>
            {Object.entries(PAYMENT_STATUS).map(([v, o]) => (
              <option key={v} value={v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button className={`pill ${refundRequired ? "active" : ""}`} onClick={() => setFilter({ refundRequired: refundRequired ? "" : "true" })} aria-pressed={refundRequired}>
          فقط نیازمند برگشت وجه
        </button>
      </div>

      <ErrorBox>{state.error}</ErrorBox>

      {state.loading ? (
        <TableSkeleton />
      ) : state.orders.length === 0 ? (
        <div className="empty panel">
          <p>سفارشی با این فیلترها پیدا نشد.</p>
        </div>
      ) : (
        <ul className="adm-rows panel">
          {state.orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="adm-row">
                <div className="grow">
                  <b dir="ltr" style={{ display: "inline-block" }}>{o.orderNumber}</b>
                  {o.refundRequired && <span className="status status-danger" style={{ marginInlineStart: 8 }}>برگشت وجه</span>}
                  <div className="muted small">
                    {o.customer.fullName} · <span dir="ltr">{o.customer.phone}</span>
                  </div>
                  <div className="muted small">{faDate(o.createdAt)}</div>
                </div>
                <div className="adm-row-end">
                  <b>{toman(o.totalPrice)} تومان</b>
                  <span className="muted small">{faNum(o.items.reduce((s, i) => s + i.quantity, 0))} کالا</span>
                </div>
                <div className="adm-badges">
                  <Badge tone={PAYMENT_STATUS[o.paymentStatus]?.tone}>{PAYMENT_STATUS[o.paymentStatus]?.label}</Badge>
                  <Badge tone={ORDER_STATUS[o.orderStatus]?.tone}>{ORDER_STATUS[o.orderStatus]?.label}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AdminPager page={page} pages={state.pages} onChange={setPage} />
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OrdersInner />
    </Suspense>
  );
}
