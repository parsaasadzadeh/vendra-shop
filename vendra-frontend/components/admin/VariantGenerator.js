"use client";
import { useMemo, useState } from "react";
import { COLOR_PRESETS, MAX_STOCK, SIZE_PRESETS, variantKey } from "@/lib/adminConstants";
import { faNum, toEnDigits } from "@/lib/format";

export const normSize = (s) => {
  const v = toEnDigits(s).trim().replace(/\s+/g, " ");
  return /^[a-z0-9]+$/i.test(v) ? v.toUpperCase() : v;
};
export const cleanStock = (v) => {
  const d = toEnDigits(v).replace(/\D/g, "").slice(0, 7);
  return Number(d) > MAX_STOCK ? String(MAX_STOCK) : d;
};

// سازنده‌ی ترکیب‌ها: چند سایز × چند رنگ → یک‌جا همه‌ی ردیف‌ها ساخته می‌شود
export default function VariantGenerator({ existingKeys = [], remaining = 100, busy = false, onGenerate, submitLabel = "ساخت ترکیب‌ها" }) {
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]); // {name, code}
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState({ name: "", code: "#2563eb" });
  const [stock, setStock] = useState("5");
  const [preset, setPreset] = useState("clothes");

  const toggleSize = (s) => setSizes((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  const toggleColor = (c) => setColors((l) => (l.some((x) => x.name === c.name) ? l.filter((x) => x.name !== c.name) : [...l, c]));

  const addCustomSize = () => {
    const s = normSize(customSize);
    if (!s || s.length > 30) return;
    setSizes((l) => (l.some((x) => x.toLowerCase() === s.toLowerCase()) ? l : [...l, s]));
    setCustomSize("");
  };
  const addCustomColor = () => {
    const name = customColor.name.trim().slice(0, 40);
    if (!name) return;
    setColors((l) => (l.some((x) => x.name.toLowerCase() === name.toLowerCase()) ? l : [...l, { name, code: customColor.code }]));
    setCustomColor((c) => ({ ...c, name: "" }));
  };

  const combos = useMemo(() => {
    const have = new Set(existingKeys);
    const colorList = colors.length ? colors : [{ name: "", code: "" }];
    const out = [];
    for (const size of sizes) for (const c of colorList) {
      const row = { size, colorName: c.name, colorCode: c.code };
      if (!have.has(variantKey(row))) out.push(row);
    }
    return out;
  }, [sizes, colors, existingKeys]);

  const tooMany = combos.length > remaining;
  const stockNum = Math.min(Number(cleanStock(stock) || 0), MAX_STOCK);

  const submit = async () => {
    if (!combos.length || tooMany) return;
    await onGenerate(combos.map((c) => ({ ...c, sku: "", stock: stockNum })));
    setSizes([]);
    setColors([]);
  };

  const sizeChips = SIZE_PRESETS[preset].sizes;
  const extraSizes = sizes.filter((s) => !sizeChips.includes(s));

  return (
    <div className="adm-gen">
      <div className="adm-gen-block">
        <h4>۱. سایزها</h4>
        <div className="pills adm-presets" role="tablist" aria-label="نوع سایز">
          {Object.entries(SIZE_PRESETS).map(([k, p]) => (
            <button type="button" key={k} className={`pill pill-static ${preset === k ? "active" : ""}`} onClick={() => setPreset(k)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="pills">
          {[...sizeChips, ...extraSizes].map((s) => (
            <button type="button" key={s} className={`pill pill-sq ${sizes.includes(s) ? "active" : ""}`} aria-pressed={sizes.includes(s)} onClick={() => toggleSize(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="adm-inline">
          <input
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
            placeholder="سایز دلخواه (مثلاً 3XL یا 45)"
            maxLength={30}
            aria-label="سایز دلخواه"
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={addCustomSize}>
            افزودن
          </button>
        </div>
      </div>

      <div className="adm-gen-block">
        <h4>۲. رنگ‌ها <small className="muted">(اختیاری)</small></h4>
        <div className="swatches">
          {COLOR_PRESETS.map((c) => {
            const active = colors.some((x) => x.name === c.name);
            return (
              <button type="button" key={c.name} className={`swatch ${active ? "active" : ""}`} title={c.name} aria-label={c.name} aria-pressed={active} onClick={() => toggleColor(c)}>
                <i style={{ background: c.code }} />
              </button>
            );
          })}
        </div>
        <div className="adm-inline">
          <input type="color" className="adm-color" value={customColor.code} onChange={(e) => setCustomColor((c) => ({ ...c, code: e.target.value }))} aria-label="انتخاب رنگ" />
          <input
            value={customColor.name}
            onChange={(e) => setCustomColor((c) => ({ ...c, name: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomColor())}
            placeholder="رنگ دلخواه (نام را بنویس)"
            maxLength={40}
            aria-label="نام رنگ دلخواه"
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={addCustomColor}>
            افزودن
          </button>
        </div>
        {colors.length > 0 && (
          <div className="chips" style={{ marginTop: 10, marginBottom: 0 }}>
            {colors.map((c) => (
              <button type="button" key={c.name} className="chip chip-color" onClick={() => toggleColor(c)} title="حذف">
                <i style={{ background: c.code }} />
                {c.name} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="adm-gen-block">
        <h4>۳. موجودی هر ترکیب</h4>
        <div className="adm-inline">
          <input dir="ltr" inputMode="numeric" value={stock} onChange={(e) => setStock(cleanStock(e.target.value))} style={{ maxWidth: 140 }} aria-label="موجودی اولیه" />
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={busy || combos.length === 0 || tooMany}>
            {busy ? "در حال افزودن…" : `${submitLabel} (${faNum(combos.length)})`}
          </button>
        </div>
        <p className="muted small">بعداً می‌توانی موجودی هر ردیف را جدا تغییر بدهی.</p>
        {tooMany && <p className="hint-error">حداکثر {faNum(remaining)} ترکیب دیگر می‌توانی اضافه کنی.</p>}
        {sizes.length > 0 && combos.length === 0 && <p className="hint-warn">همه‌ی این ترکیب‌ها قبلاً ثبت شده‌اند.</p>}
      </div>
    </div>
  );
}
