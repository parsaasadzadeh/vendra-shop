"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { GENDERS, SORTS } from "@/lib/constants";
import { IconCheck, IconClose, IconFilter } from "./Icons";
import { faNum, toEnDigits } from "@/lib/format";

function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const update = (updates) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    });
    next.delete("page");
    const q = next.toString();
    start(() => router.push(q ? `${pathname}?${q}` : pathname, { scroll: false }));
  };
  return { sp, update, pending };
}

export function SortSelect() {
  const { sp, update } = useUrlState();
  return (
    <label className="select-wrap">
      <span className="sr-only">مرتب‌سازی</span>
      <select value={sp.get("sort") || "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}>
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterTrigger({ activeCount = 0 }) {
  return (
    <button className="btn btn-ghost filter-trigger" onClick={() => window.dispatchEvent(new Event("vendra:open-filters"))}>
      <IconFilter size={18} />
      فیلترها
      {activeCount > 0 && <span className="badge-count static">{faNum(activeCount)}</span>}
    </button>
  );
}

export default function ShopFilters({ facets, categories = [], activeCount = 0 }) {
  const { sp, update, pending } = useUrlState();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(sp.get("minPrice") || "");
  const [max, setMax] = useState(sp.get("maxPrice") || "");

  useEffect(() => {
    setMin(sp.get("minPrice") || "");
    setMax(sp.get("maxPrice") || "");
  }, [sp]);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("vendra:open-filters", on);
    return () => window.removeEventListener("vendra:open-filters", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const gender = sp.get("gender") || "";
  const category = sp.get("category") || "";
  const size = sp.get("size") || "";
  const color = sp.get("color") || "";
  const inStock = sp.get("inStock") === "true";

  const toggle = (key, value, current) => update({ [key]: current === value ? "" : value });
  const applyPrice = () => update({ minPrice: toEnDigits(min).replace(/\D/g, ""), maxPrice: toEnDigits(max).replace(/\D/g, "") });
  const clearAll = () => {
    update({ gender: "", category: "", size: "", color: "", minPrice: "", maxPrice: "", inStock: "", featured: "", search: "" });
    setOpen(false);
  };

  return (
    <>
      {open && <div className="scrim show" onClick={() => setOpen(false)} />}
      <aside className={`filters ${open ? "open" : ""} ${pending ? "is-pending" : ""}`} aria-label="فیلتر محصولات">
        <div className="filters-head">
          <h2>فیلترها</h2>
          <button className="icon-btn only-mobile" onClick={() => setOpen(false)} aria-label="بستن">
            <IconClose />
          </button>
          {activeCount > 0 && (
            <button className="link-btn" onClick={clearAll}>
              حذف همه
            </button>
          )}
        </div>

        <div className="filters-body">
          <fieldset className="f-group">
            <legend>دسته‌بندی جنسیتی</legend>
            <div className="pills">
              {GENDERS.map((g) => (
                <button key={g.value} className={`pill ${gender === g.value ? "active" : ""}`} onClick={() => toggle("gender", g.value, gender)}>
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>

          {categories.length > 0 && (
            <fieldset className="f-group">
              <legend>دسته‌بندی</legend>
              <div className="pills">
                {categories.map((c) => (
                  <button key={c} className={`pill ${category === c ? "active" : ""}`} onClick={() => toggle("category", c, category)}>
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {facets.sizes.length > 0 && (
            <fieldset className="f-group">
              <legend>سایز</legend>
              <div className="pills">
                {facets.sizes.map((s) => (
                  <button key={s} className={`pill pill-sq ${size === s ? "active" : ""}`} onClick={() => toggle("size", s, size)}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {facets.colors.length > 0 && (
            <fieldset className="f-group">
              <legend>رنگ</legend>
              <div className="swatches">
                {facets.colors.map((c) => (
                  <button
                    key={c.name}
                    className={`swatch ${color === c.name ? "active" : ""}`}
                    onClick={() => toggle("color", c.name, color)}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={color === c.name}
                  >
                    <i style={{ background: c.code || "#bbb" }} />
                    {color === c.name && <IconCheck size={14} />}
                  </button>
                ))}
              </div>
              {(size || color) && <p className="muted small">فقط ترکیب‌هایی که همین الان موجودند نشان داده می‌شوند.</p>}
            </fieldset>
          )}

          <fieldset className="f-group">
            <legend>محدوده قیمت (تومان)</legend>
            <div className="price-inputs">
              <input inputMode="numeric" placeholder="از" value={min} onChange={(e) => setMin(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === "Enter" && applyPrice()} aria-label="حداقل قیمت" />
              <span>تا</span>
              <input inputMode="numeric" placeholder="تا" value={max} onChange={(e) => setMax(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === "Enter" && applyPrice()} aria-label="حداکثر قیمت" />
            </div>
          </fieldset>

          <label className="switch-row">
            <span>فقط کالاهای موجود</span>
            <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked ? "true" : "" })} />
            <i className="switch" aria-hidden="true" />
          </label>
        </div>

        <div className="filters-foot only-mobile">
          <button className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
            مشاهده نتایج
          </button>
        </div>
      </aside>
    </>
  );
}
