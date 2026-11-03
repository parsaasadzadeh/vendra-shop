"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart, useShipping } from "@/context/Providers";
import { toman } from "@/lib/format";
import { hasFreeThreshold } from "@/lib/shipping";
import { productPath } from "@/lib/paths";
import { IconBag, IconClose, IconTrash } from "./Icons";
import QtyStepper from "./QtyStepper";

export default function CartDrawer() {
  const { items, subtotal, drawerOpen, closeDrawer, setQty, removeItem, count } = useCart();
  const shipping = useShipping();
  const showProgress = hasFreeThreshold(shipping);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  const remaining = Math.max(shipping.freeThreshold - subtotal, 0);
  const progress = shipping.freeThreshold > 0 ? Math.min((subtotal / shipping.freeThreshold) * 100, 100) : 100;

  return (
    <>
      <div className={`scrim ${drawerOpen ? "show" : ""}`} onClick={closeDrawer} />
      <aside className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen} aria-label="سبد خرید">
        <div className="drawer-head">
          <h2>سبد خرید</h2>
          <button className="icon-btn" onClick={closeDrawer} aria-label="بستن">
            <IconClose />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty drawer-empty">
            <IconBag size={42} />
            <p>سبد خرید شما خالی است</p>
            <Link href="/shop" className="btn btn-primary" onClick={closeDrawer}>
              شروع خرید
            </Link>
          </div>
        ) : (
          <>
            {showProgress && (
              <div className="ship-progress">
                <p>
                  {remaining > 0 ? (
                    <>
                      <b>{toman(remaining)}</b> تومان تا ارسال رایگان
                    </>
                  ) : (
                    <b>🎉 ارسال سفارش شما رایگان است</b>
                  )}
                </p>
                <div className="bar">
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <ul className="drawer-list">
              {items.map((i) => (
                <li key={`${i.productId}:${i.variantId}`} className="line">
                  <Link href={productPath(i)} className="line-img" onClick={closeDrawer}>
                    {i.image ? <Image src={i.image} alt={i.title} fill sizes="80px" /> : <span className="img-fallback">{i.title?.[0]}</span>}
                  </Link>
                  <div className="line-info">
                    <Link href={productPath(i)} className="line-title" onClick={closeDrawer}>
                      {i.title}
                    </Link>
                    <div className="line-variant">
                      {i.size && <span>سایز {i.size}</span>}
                      {i.colorName && (
                        <span className="chip-color">
                          <i style={{ background: i.colorCode || "#bbb" }} />
                          {i.colorName}
                        </span>
                      )}
                    </div>
                    <div className="line-bottom">
                      <QtyStepper size="sm" value={i.quantity} max={i.max || 20} onChange={(q) => setQty(i.productId, i.variantId, q)} />
                      <b className="price">{toman(i.price * i.quantity)}</b>
                    </div>
                  </div>
                  <button className="icon-btn line-remove" onClick={() => removeItem(i.productId, i.variantId)} aria-label="حذف">
                    <IconTrash size={18} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="drawer-foot">
              <div className="sum-row">
                <span>جمع کالاها ({new Intl.NumberFormat("fa-IR").format(count)})</span>
                <b>{toman(subtotal)} تومان</b>
              </div>
              <p className="muted small">هزینه ارسال و قیمت نهایی در مرحله بعد محاسبه می‌شود.</p>
              <Link href="/checkout" className="btn btn-primary btn-lg btn-block" onClick={closeDrawer}>
                ادامه و تکمیل خرید
              </Link>
              <Link href="/cart" className="btn btn-ghost btn-block" onClick={closeDrawer}>
                مشاهده سبد خرید
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
