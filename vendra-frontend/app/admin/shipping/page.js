"use client";
import { useEffect, useState } from "react";
import { ErrorBox, Field, PageHead } from "@/components/admin/ui";
import { IconTruck } from "@/components/Icons";
import { useToast } from "@/context/Providers";
import { getShippingSettings, updateShippingSettings } from "@/lib/adminApi";
import { faDate, toEnDigits, toman } from "@/lib/format";
import { shippingMessage } from "@/lib/shipping";

const digits = (v) => toEnDigits(v).replace(/[^\d]/g, "").slice(0, 9);

export default function ShippingSettingsPage() {
  const toast = useToast();
  const [saved, setSaved] = useState(null); // آخرین مقدار ذخیره‌شده در سرور
  const [price, setPrice] = useState("");
  const [freeOn, setFreeOn] = useState(true);
  const [threshold, setThreshold] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const apply = (s) => {
    setSaved(s);
    setPrice(String(s.shippingPrice));
    setFreeOn(s.freeShippingThreshold > 0);
    setThreshold(s.freeShippingThreshold > 0 ? String(s.freeShippingThreshold) : "");
  };

  useEffect(() => {
    let alive = true;
    getShippingSettings()
      .then((r) => alive && apply(r.settings))
      .catch((e) => alive && e.status !== 401 && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const priceN = Number(price || 0);
  const thresholdN = freeOn ? Number(threshold || 0) : 0;
  const preview = shippingMessage({ price: priceN, freeThreshold: thresholdN });
  const dirty = saved && (priceN !== saved.shippingPrice || thresholdN !== saved.freeShippingThreshold);

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setError("");
    const e = {};
    if (price === "") e.price = "هزینه‌ی ارسال را وارد کنید (برای ارسال رایگان ۰ بنویسید)";
    else if (priceN > 10_000_000) e.price = "حداکثر ۱۰٬۰۰۰٬۰۰۰ تومان";
    if (freeOn && priceN > 0 && thresholdN <= 0) e.threshold = "حداقل مبلغ خرید را وارد کنید";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const r = await updateShippingSettings({ shippingPrice: priceN, freeShippingThreshold: priceN === 0 ? 0 : thresholdN });
      apply(r.settings);
      toast("هزینه‌ی ارسال ذخیره شد");
    } catch (err) {
      if (err.status !== 401) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="هزینه‌ی ارسال" subtitle="هر وقت نرخ پست یا پیک عوض شد، همین‌جا تغییرش بدهید">
        {saved?.updatedAt && <span className="muted small">آخرین تغییر: {faDate(saved.updatedAt)}</span>}
      </PageHead>
      <ErrorBox>{error}</ErrorBox>

      {!saved && !error ? (
        <div className="skeleton" style={{ height: 280 }} />
      ) : (
        saved && (
          <form className="panel adm-form" onSubmit={submit} noValidate>
            <div className="form-grid">
              <Field label="هزینه‌ی ارسال (تومان)" error={errors.price} hint={priceN > 0 ? `${toman(priceN)} تومان` : "۰ یعنی ارسال همه‌ی سفارش‌ها رایگان است"}>
                <input dir="ltr" inputMode="numeric" value={price} onChange={(e) => setPrice(digits(e.target.value))} placeholder="80000" />
              </Field>

              {priceN > 0 && (
                <Field label="حداقل خرید برای ارسال رایگان (تومان)" error={errors.threshold} hint={freeOn ? (thresholdN > 0 ? `${toman(thresholdN)} تومان` : "") : "ارسال رایگان خاموش است"}>
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    value={threshold}
                    disabled={!freeOn}
                    onChange={(e) => setThreshold(digits(e.target.value))}
                    placeholder="2000000"
                  />
                </Field>
              )}
            </div>

            {priceN > 0 && (
              <label className="switch-row adm-toggle">
                <span>
                  ارسال رایگان برای خریدهای بالا
                  <small className="muted" style={{ display: "block", fontWeight: 500 }}>خاموش = همه‌ی سفارش‌ها هزینه‌ی ارسال می‌دهند</small>
                </span>
                <input type="checkbox" checked={freeOn} onChange={(e) => setFreeOn(e.target.checked)} />
                <span className="switch" aria-hidden="true" />
              </label>
            )}

            <div className="ship-preview" aria-live="polite">
              <IconTruck size={20} />
              <div>
                <small className="muted">مشتری این را می‌بیند</small>
                <b>{preview}</b>
              </div>
            </div>

            <p className="muted small">
              هزینه‌ی هر سفارش هنگام ثبت در خود سفارش ذخیره می‌شود؛ تغییر امروز روی سفارش‌های قبلی اثر ندارد. ویترین تا حدود یک دقیقه ممکن است متن قبلی را نشان بدهد، ولی مبلغ نهایی همیشه با نرخ جدید حساب می‌شود.
            </p>

            <div className="adm-inline" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit" disabled={busy || !dirty}>
                {busy ? "در حال ذخیره…" : "ذخیره‌ی تغییرات"}
              </button>
            </div>
          </form>
        )
      )}
    </>
  );
}
