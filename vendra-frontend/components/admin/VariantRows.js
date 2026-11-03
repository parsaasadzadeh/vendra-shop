"use client";
import { useMemo, useState } from "react";
import { IconTrash } from "@/components/Icons";
import { MAX_VARIANTS, variantKey } from "@/lib/adminConstants";
import { faNum } from "@/lib/format";
import { addVariant, removeVariant, updateVariant } from "@/lib/adminApi";
import { useToast } from "@/context/Providers";
import VariantGenerator, { cleanStock, normSize } from "./VariantGenerator";
import { ErrorBox } from "./ui";

const FALLBACK_CODE = "#9ca3af";
export const emptyRow = () => ({ key: `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`, size: "", colorName: "", colorCode: "", sku: "", stock: "0" });

// ورودی‌های یک ردیف سایز/رنگ
function RowFields({ v, onChange, disabled }) {
  const set = (patch) => onChange({ ...v, ...patch });
  return (
    <>
      <label className="adm-vcell adm-v-size">
        <span className="sr-only">سایز</span>
        <input value={v.size} maxLength={30} placeholder="سایز" disabled={disabled} onChange={(e) => set({ size: e.target.value })} onBlur={() => set({ size: normSize(v.size) })} />
      </label>
      <div className="adm-vcell adm-v-color">
        <input
          type="color"
          className="adm-color"
          value={v.colorCode || FALLBACK_CODE}
          disabled={disabled}
          onChange={(e) => set({ colorCode: e.target.value })}
          aria-label="کد رنگ"
        />
        <input value={v.colorName} maxLength={40} placeholder="نام رنگ (اختیاری)" disabled={disabled} onChange={(e) => set({ colorName: e.target.value })} aria-label="نام رنگ" />
      </div>
      <label className="adm-vcell adm-v-sku">
        <span className="sr-only">SKU</span>
        <input dir="ltr" value={v.sku} maxLength={60} placeholder="SKU (اختیاری)" disabled={disabled} onChange={(e) => set({ sku: e.target.value })} />
      </label>
      <label className="adm-vcell adm-v-stock">
        <span className="sr-only">موجودی</span>
        <input dir="ltr" inputMode="numeric" value={v.stock} placeholder="موجودی" disabled={disabled} onChange={(e) => set({ stock: cleanStock(e.target.value) })} />
      </label>
    </>
  );
}

const VHead = () => (
  <div className="adm-vhead" aria-hidden="true">
    <span>سایز</span>
    <span>رنگ</span>
    <span>SKU</span>
    <span>موجودی</span>
    <span />
  </div>
);

// payload یک ردیف برای بک‌اند
export const rowPayload = (r) => ({
  size: normSize(r.size),
  colorName: r.colorName.trim(),
  colorCode: r.colorName.trim() ? r.colorCode || FALLBACK_CODE : "",
  sku: r.sku.trim(),
  stock: Number(r.stock || 0),
});

/* ------------------------------------------------------------------ */
/* ساخت محصول: ردیف‌ها فقط در حافظه‌اند و همراه محصول ثبت می‌شوند       */
/* ------------------------------------------------------------------ */
export function VariantsCreate({ rows, setRows, errors = {} }) {
  const keys = useMemo(() => rows.filter((r) => r.size.trim()).map((r) => variantKey({ size: normSize(r.size), colorName: r.colorName })), [rows]);
  const total = rows.reduce((s, r) => s + Number(r.stock || 0), 0);

  return (
    <div>
      <VariantGenerator
        existingKeys={keys}
        remaining={MAX_VARIANTS - rows.length}
        onGenerate={(combos) => setRows((r) => [...r.filter((x) => x.size.trim()), ...combos.map((c) => ({ ...emptyRow(), ...c, stock: String(c.stock) }))])}
      />

      <div className="adm-vlist">
        <div className="adm-vtitle">
          <h4>ترکیب‌های ثبت‌شده ({faNum(rows.length)})</h4>
          <span className="muted small">جمع موجودی: {faNum(total)}</span>
        </div>
        {errors.variants && <p className="hint-error">{errors.variants}</p>}
        {rows.length === 0 ? (
          <p className="muted">هنوز سایزی اضافه نشده. از بخش بالا انتخاب کن یا یک ردیف دستی اضافه کن.</p>
        ) : (
          <>
            <VHead />
            {rows.map((r) => (
              <div className="adm-vrow" key={r.key}>
                <RowFields v={r} onChange={(nv) => setRows((list) => list.map((x) => (x.key === r.key ? nv : x)))} />
                <button type="button" className="icon-btn adm-v-del" onClick={() => setRows((l) => l.filter((x) => x.key !== r.key))} aria-label="حذف ردیف">
                  <IconTrash size={18} />
                </button>
              </div>
            ))}
          </>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows((l) => [...l, emptyRow()])} disabled={rows.length >= MAX_VARIANTS}>
          + ردیف دستی
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ویرایش محصول: هر تغییر مستقیم با API مخصوص سایز/رنگ ذخیره می‌شود      */
/* ------------------------------------------------------------------ */
const toDraft = (v) => ({ key: v.id, size: v.size, colorName: v.colorName || "", colorCode: v.colorCode || "", sku: v.sku || "", stock: String(v.stock) });

function ManageRow({ productId, v, onProduct, setBusy, busy, setError }) {
  const toast = useToast();
  const [d, setD] = useState(toDraft(v));
  const orig = toDraft(v);
  const dirty = ["size", "colorName", "colorCode", "sku", "stock"].some((k) => d[k] !== orig[k]);

  const save = async () => {
    setError("");
    if (!normSize(d.size)) return setError("سایز نمی‌تواند خالی باشد");
    const p = rowPayload(d);
    const patch = {};
    if (p.size !== v.size) patch.size = p.size;
    if (p.colorName !== (v.colorName || "")) patch.colorName = p.colorName;
    if (p.colorCode !== (v.colorCode || "")) patch.colorCode = p.colorCode;
    if (p.sku !== (v.sku || "")) patch.sku = p.sku;
    // موجودی به‌صورت «اختلاف» ارسال می‌شود تا اگر همزمان فروش رفته باشد، روی آن بازنویسی نشود
    const delta = p.stock - v.stock;
    if (delta !== 0) patch.stockDelta = delta;
    if (!Object.keys(patch).length) return setD(orig);

    setBusy(v.id);
    try {
      const r = await updateVariant(productId, v.id, patch);
      onProduct(r.product);
      toast("ذخیره شد");
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const del = async () => {
    if (!window.confirm(`ترکیب «${v.size}${v.colorName ? ` / ${v.colorName}` : ""}» حذف شود؟`)) return;
    setError("");
    setBusy(v.id);
    try {
      const r = await removeVariant(productId, v.id);
      onProduct(r.product);
      toast("حذف شد");
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className={`adm-vrow ${dirty ? "is-dirty" : ""}`}>
      <RowFields v={d} onChange={setD} disabled={busy === v.id} />
      <div className="adm-v-actions">
        {dirty && (
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!!busy}>
            ذخیره
          </button>
        )}
        <button type="button" className="icon-btn adm-v-del" onClick={del} disabled={!!busy} aria-label="حذف ردیف">
          <IconTrash size={18} />
        </button>
      </div>
    </div>
  );
}

export function VariantsManage({ product, onProduct }) {
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [single, setSingle] = useState(emptyRow());

  const keys = useMemo(() => product.variants.map((v) => variantKey(v)), [product.variants]);

  const addMany = async (combos) => {
    setError("");
    setAdding(true);
    let last = null;
    let done = 0;
    try {
      for (const c of combos) {
        setProgress(`${faNum(done + 1)} از ${faNum(combos.length)}`);
        const r = await addVariant(product.id, { size: c.size, colorName: c.colorName, colorCode: c.colorName ? c.colorCode : "", sku: c.sku, stock: c.stock });
        last = r.product;
        done++;
      }
      toast(`${faNum(done)} ترکیب اضافه شد`);
    } catch (e) {
      if (e.status !== 401) setError(`${e.message}${done ? ` (${faNum(done)} مورد قبل از خطا ثبت شد)` : ""}`);
    } finally {
      if (last) onProduct(last);
      setAdding(false);
      setProgress("");
    }
  };

  const addSingle = async () => {
    const p = rowPayload(single);
    if (!p.size) return setError("سایز را وارد کن");
    await addMany([p]);
    setSingle(emptyRow());
  };

  const total = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div>
      <ErrorBox>{error}</ErrorBox>
      <VariantGenerator existingKeys={keys} remaining={MAX_VARIANTS - product.variants.length} busy={adding} onGenerate={addMany} submitLabel="افزودن به محصول" />
      {progress && <p className="muted small">در حال افزودن… {progress}</p>}

      <div className="adm-vlist">
        <div className="adm-vtitle">
          <h4>سایز و رنگ‌های فعلی ({faNum(product.variants.length)})</h4>
          <span className="muted small">جمع موجودی: {faNum(total)}</span>
        </div>
        {product.variants.length === 0 ? (
          <p className="hint-warn">این محصول هیچ سایز/رنگی ندارد و برای مشتری «ناموجود» است.</p>
        ) : (
          <>
            <VHead />
            {product.variants.map((v) => (
              <ManageRow
                key={`${v.id}:${v.size}:${v.colorName}:${v.colorCode}:${v.sku}:${v.stock}`}
                productId={product.id}
                v={v}
                onProduct={onProduct}
                busy={busy}
                setBusy={setBusy}
                setError={setError}
              />
            ))}
            <p className="muted small">تغییر موجودی به‌صورت نسبی ثبت می‌شود؛ پس اگر همزمان فروش رفته باشد، آن فروش از بین نمی‌رود.</p>
          </>
        )}

        <details className="adm-single">
          <summary>افزودن یک ترکیب دستی</summary>
          <div className="adm-vrow">
            <RowFields v={single} onChange={setSingle} disabled={adding} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={addSingle} disabled={adding}>
              افزودن
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
