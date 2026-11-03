"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconAlert, IconShield } from "@/components/Icons";
import { useCart } from "@/context/Providers";
import { createOrder, quoteCart, requestPayment } from "@/lib/api";
import { PROVINCES } from "@/lib/constants";
import { faNum, toEnDigits, toman } from "@/lib/format";
import { getSavedCustomer, saveCustomer, saveOrder } from "@/lib/storage";

const EMPTY = { fullName: "", phone: "", province: "", city: "", fullAddress: "", plaque: "", unit: "", postalCode: "", note: "" };

const Field = ({ error, label, hint, children, wide }) => (
  <label className={`field ${wide ? "wide" : ""} ${error ? "invalid" : ""}`}>
    <span>{label}</span>
    {children}
    {error ? <em className="err">{error}</em> : hint ? <em className="hint">{hint}</em> : null}
  </label>
);

const validate = (f) => {
  const e = {};
  const phone = toEnDigits(f.phone).replace(/[\s-]/g, "");
  const postal = toEnDigits(f.postalCode).replace(/\s/g, "");
  if (f.fullName.trim().length < 3) e.fullName = "نام و نام خانوادگی را کامل وارد کنید";
  if (!/^(\+98|0098|0)?9\d{9}$/.test(phone)) e.phone = "شماره موبایل معتبر نیست (مثال: 09123456789)";
  if (!f.province) e.province = "استان را انتخاب کنید";
  if (!f.city.trim()) e.city = "شهر را وارد کنید";
  if (f.fullAddress.trim().length < 8) e.fullAddress = "آدرس را کامل‌تر بنویسید";
  if (!f.plaque.trim()) e.plaque = "پلاک را وارد کنید";
  if (!/^\d{10}$/.test(postal)) e.postalCode = "کد پستی باید ۱۰ رقم باشد";
  return e;
};

export default function CheckoutPage() {
  const { items, ready, clear } = useCart();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [issues, setIssues] = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    const saved = getSavedCustomer();
    if (saved) setForm((f) => ({ ...f, ...saved }));
  }, []);

  const signature = useMemo(() => items.map((i) => `${i.productId}:${i.variantId}:${i.quantity}`).join("|"), [items]);

  useEffect(() => {
    if (!ready) return;
    if (items.length === 0) return setLoading(false);
    let alive = true;
    setLoading(true);
    quoteCart(items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })))
      .then((q) => alive && setQuote(q))
      .catch((e) => alive && setServerError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");
    setIssues([]);
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) {
      const first = formRef.current?.querySelector(`[name="${Object.keys(v)[0]}"]`);
      first?.focus();
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (!quote?.canCheckout) return setServerError("ابتدا مشکل کالاهای سبد را برطرف کنید.");

    setBusy(true);
    try {
      const { order } = await createOrder({
        items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
        customer: { fullName: form.fullName, phone: toEnDigits(form.phone) },
        shippingAddress: {
          province: form.province,
          city: form.city,
          fullAddress: form.fullAddress,
          plaque: form.plaque,
          unit: form.unit,
          postalCode: toEnDigits(form.postalCode),
        },
        note: form.note,
      });

      saveCustomer({ ...form, note: "" });
      saveOrder({ orderNumber: order.orderNumber, token: order.trackingToken, totalPrice: order.totalPrice });
      clear(); // موجودی رزرو شده؛ پرداخت از صفحه پیگیری هم قابل انجام است

      try {
        const { paymentUrl } = await requestPayment(order.trackingToken);
        window.location.href = paymentUrl;
      } catch {
        window.location.href = `/track/${order.trackingToken}?pay=retry`;
      }
    } catch (err) {
      const list = err.details?.issues || [];
      setIssues(list);
      setServerError(err.message);
      setBusy(false);
      if (err.status === 409) {
        quoteCart(items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }))).then(setQuote).catch(() => {});
      }
    }
  };

  if (ready && items.length === 0) {
    return (
      <div className="container section">
        <div className="empty big">
          <h1>سبد خرید شما خالی است</h1>
          <p>برای ثبت سفارش ابتدا محصولی به سبد اضافه کنید.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">مشاهده محصولات</Link>
        </div>
      </div>
    );
  }


  return (
    <div className="container section-sm">
      <div className="page-head">
        <h1>تکمیل خرید</h1>
        <p className="muted">بدون نیاز به ثبت‌نام؛ فقط اطلاعات ارسال را وارد کنید.</p>
      </div>

      <div className="cart-layout">
        <form className="panel form-grid" onSubmit={submit} ref={formRef} noValidate>
          <h2 className="wide">اطلاعات گیرنده</h2>
          <Field error={errors.fullName} label="نام و نام خانوادگی">
            <input name="fullName" value={form.fullName} onChange={set("fullName")} autoComplete="name" placeholder="مثلاً علی رضایی" />
          </Field>
          <Field error={errors.phone} label="شماره موبایل" hint="برای هماهنگی ارسال و پیگیری سفارش">
            <input name="phone" dir="ltr" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="09123456789" />
          </Field>

          <h2 className="wide">آدرس تحویل</h2>
          <Field error={errors.province} label="استان">
            <select name="province" value={form.province} onChange={set("province")} autoComplete="address-level1">
              <option value="">انتخاب کنید</option>
              {PROVINCES.map((p) => (<option key={p}>{p}</option>))}
            </select>
          </Field>
          <Field error={errors.city} label="شهر">
            <input name="city" value={form.city} onChange={set("city")} autoComplete="address-level2" />
          </Field>
          <Field error={errors.fullAddress} label="آدرس کامل" wide>
            <textarea name="fullAddress" rows={3} value={form.fullAddress} onChange={set("fullAddress")} autoComplete="street-address" placeholder="خیابان، کوچه، ..." />
          </Field>
          <Field error={errors.plaque} label="پلاک">
            <input name="plaque" inputMode="numeric" value={form.plaque} onChange={set("plaque")} />
          </Field>
          <Field error={errors.unit} label="واحد (اختیاری)">
            <input name="unit" inputMode="numeric" value={form.unit} onChange={set("unit")} />
          </Field>
          <Field error={errors.postalCode} label="کد پستی" hint="۱۰ رقم، بدون خط تیره">
            <input name="postalCode" dir="ltr" inputMode="numeric" maxLength={14} value={form.postalCode} onChange={set("postalCode")} autoComplete="postal-code" />
          </Field>
          <Field error={errors.note} label="توضیحات سفارش (اختیاری)" wide>
            <textarea name="note" rows={2} value={form.note} onChange={set("note")} maxLength={500} />
          </Field>

          {(serverError || issues.length > 0) && (
            <div className="alert alert-error wide" role="alert">
              <IconAlert />
              <div>
                <b>{serverError}</b>
                {issues.length > 0 && (
                  <ul>{issues.map((it, idx) => (<li key={idx}>{it.message || it.code}</li>))}</ul>
                )}
                <Link href="/cart" className="link-btn">بازگشت به سبد خرید</Link>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-lg btn-block wide" disabled={busy || loading || (quote && !quote.canCheckout)}>
            {busy ? "در حال ثبت سفارش و انتقال به درگاه…" : `ثبت سفارش و پرداخت ${quote ? `(${toman(quote.totalPrice)} تومان)` : ""}`}
          </button>
          <p className="secure wide"><IconShield size={18} /> پرداخت روی درگاه امن زیبال انجام می‌شود و اطلاعات کارت شما نزد ما ذخیره نمی‌شود.</p>
        </form>

        <aside className="summary panel">
          <h2>سفارش شما</h2>
          <ul className="mini-list">
            {items.map((i) => (
              <li key={`${i.productId}:${i.variantId}`}>
                <span className="mini-img">{i.image && <img src={i.image} alt="" loading="lazy" />}<b>{faNum(i.quantity)}</b></span>
                <div className="grow">
                  <span className="line-title">{i.title}</span>
                  <span className="muted small">{[i.size && `سایز ${i.size}`, i.colorName].filter(Boolean).join(" · ")}</span>
                </div>
                <span>{toman(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="sum-row"><span>جمع کالاها</span><span>{quote ? `${toman(quote.itemsPrice)} تومان` : "…"}</span></div>
          <div className="sum-row"><span>هزینه ارسال</span><span>{quote ? (quote.shippingPrice ? `${toman(quote.shippingPrice)} تومان` : "رایگان") : "…"}</span></div>
          <div className="sum-row total"><span>مبلغ قابل پرداخت</span><b>{quote ? `${toman(quote.totalPrice)} تومان` : "…"}</b></div>
          {quote && !quote.canCheckout && <p className="hint-error">بعضی کالاها موجود نیستند؛ <Link href="/cart" className="link-btn">اصلاح سبد</Link></p>}
        </aside>
      </div>
    </div>
  );
}
