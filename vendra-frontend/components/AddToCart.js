"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart, useToast } from "@/context/Providers";
import { discountPercent, faNum, toman } from "@/lib/format";
import { IconBag, IconCheck } from "./Icons";
import QtyStepper from "./QtyStepper";

export default function AddToCart({ product }) {
  const { addItem, openDrawer } = useCart();
  const toast = useToast();
  const router = useRouter();

  const sizes = product.options?.sizes || [];
  const colors = product.options?.colors || [];
  const variants = product.variants || [];

  const [size, setSize] = useState(sizes.length === 1 ? sizes[0].size : "");
  const [color, setColor] = useState(colors.length === 1 ? colors[0].name : "");
  const [qty, setQty] = useState(1);
  const [hint, setHint] = useState("");
  const [added, setAdded] = useState(false);

  const needColor = colors.length > 0;

  const variant = useMemo(
    () => variants.find((v) => v.size === size && (needColor ? v.colorName === color : true)),
    [variants, size, color, needColor]
  );

  const sizeAvailable = (s) => variants.some((v) => v.size === s && v.inStock && (!color || v.colorName === color));
  const colorAvailable = (c) => variants.some((v) => v.colorName === c && v.inStock && (!size || v.size === size));

  const max = variant ? Math.max(variant.stock, 1) : 20;
  const qtyClamped = Math.min(qty, max);
  const off = discountPercent(product);

  const validate = () => {
    if (!product.inStock) return false;
    if (!size) return setHint("لطفاً سایز را انتخاب کنید"), false;
    if (needColor && !color) return setHint("لطفاً رنگ را انتخاب کنید"), false;
    if (!variant) return setHint("این ترکیب سایز و رنگ موجود نیست"), false;
    if (!variant.inStock) return setHint("این ترکیب تمام شده است"), false;
    setHint("");
    return true;
  };

  const add = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug || "",
        variantId: variant.id,
        title: product.title,
        image: product.images?.[0] || "",
        price: product.finalPrice,
        size: variant.size,
        colorName: variant.colorName,
        colorCode: variant.colorCode,
        max: variant.stock,
      },
      qtyClamped
    );
  };

  const onAdd = () => {
    if (!validate()) return;
    add();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast("به سبد خرید اضافه شد");
    openDrawer();
  };

  const onBuyNow = () => {
    if (!validate()) return;
    add();
    router.push("/checkout");
  };

  const stockNote =
    variant && variant.inStock && variant.stock <= 5 ? `فقط ${faNum(variant.stock)} عدد در انبار باقی مانده` : "";

  return (
    <div className="buybox">
      <div className="pdp-price">
        <span className="price big">
          {toman(product.finalPrice)} <small>تومان</small>
        </span>
        {product.hasDiscount && (
          <>
            <del className="old-price">{toman(product.price)}</del>
            <span className="badge badge-sale">٪{faNum(off)} تخفیف</span>
          </>
        )}
      </div>

      {sizes.length > 0 && (
        <div className="opt">
          <div className="opt-head">
            <b>سایز</b>
            {size && <span className="muted">{size}</span>}
          </div>
          <div className="sizes" role="radiogroup" aria-label="انتخاب سایز">
            {sizes.map((s) => {
              const ok = sizeAvailable(s.size);
              return (
                <button
                  key={s.size}
                  type="button"
                  role="radio"
                  aria-checked={size === s.size}
                  className={`size-btn ${size === s.size ? "active" : ""} ${!ok ? "off" : ""}`}
                  onClick={() => (setSize(s.size), setHint(""), setQty(1))}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {needColor && (
        <div className="opt">
          <div className="opt-head">
            <b>رنگ</b>
            {color && <span className="muted">{color}</span>}
          </div>
          <div className="colors" role="radiogroup" aria-label="انتخاب رنگ">
            {colors.map((c) => {
              const ok = colorAvailable(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={color === c.name}
                  aria-label={c.name}
                  title={c.name}
                  className={`color-btn ${color === c.name ? "active" : ""} ${!ok ? "off" : ""}`}
                  onClick={() => (setColor(c.name), setHint(""), setQty(1))}
                >
                  <i style={{ background: c.code || "#bbb" }} />
                  {color === c.name && <IconCheck size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hint && <p className="hint-error" role="alert">{hint}</p>}
      {stockNote && <p className="hint-warn">{stockNote}</p>}

      {product.inStock ? (
        <>
          <div className="buy-row">
            <QtyStepper value={qtyClamped} max={max} onChange={setQty} />
            <button className={`btn btn-primary btn-lg grow ${added ? "is-done" : ""}`} onClick={onAdd}>
              {added ? <IconCheck /> : <IconBag />}
              {added ? "اضافه شد" : "افزودن به سبد خرید"}
            </button>
          </div>
          <button className="btn btn-dark btn-lg btn-block" onClick={onBuyNow}>
            خرید سریع
          </button>
        </>
      ) : (
        <button className="btn btn-lg btn-block" disabled>
          ناموجود
        </button>
      )}

      {/* نوار خرید ثابت در موبایل */}
      {product.inStock && (
        <div className="sticky-buy">
          <div>
            <span className="muted small">قیمت</span>
            <b className="price">{toman(product.finalPrice)} تومان</b>
          </div>
          <button className="btn btn-primary" onClick={onAdd}>
            <IconBag size={20} /> افزودن به سبد
          </button>
        </div>
      )}
    </div>
  );
}
