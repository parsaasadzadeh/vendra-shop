"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import OrderView from "@/components/OrderView";
import { getOrderByToken } from "@/lib/api";

export default function TrackTokenPage({ params }) {
  const { token } = use(params);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getOrderByToken(token)
      .then((r) => alive && setOrder(r.order))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="container section-sm narrow">
      <div className="page-head"><h1>پیگیری سفارش</h1></div>
      {error ? (
        <div className="empty">
          <p>{error}</p>
          <Link href="/track" className="btn btn-primary">پیگیری با شماره سفارش و موبایل</Link>
        </div>
      ) : !order ? (
        <div className="skeleton" style={{ height: 320 }} />
      ) : (
        <OrderView order={order} token={token} onChange={setOrder} />
      )}
    </div>
  );
}
