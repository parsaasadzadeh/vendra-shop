"use client";
import { useEffect, useState } from "react";
import { IconAlert } from "@/components/Icons";
import { faNum } from "@/lib/format";

export const Field = ({ label, hint, error, children, wide, className = "" }) => (
  <label className={`field ${wide ? "wide" : ""} ${error ? "invalid" : ""} ${className}`}>
    <span>{label}</span>
    {children}
    {error ? <em className="err">{error}</em> : hint ? <em className="hint">{hint}</em> : null}
  </label>
);

export const Badge = ({ tone = "info", children }) => <span className={`status status-${tone}`}>{children}</span>;

export const ErrorBox = ({ children }) =>
  children ? (
    <div className="alert alert-error" role="alert">
      <IconAlert size={20} />
      <div>{children}</div>
    </div>
  ) : null;

export const PageHead = ({ title, subtitle, children }) => (
  <div className="adm-head">
    <div>
      <h1>{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
    {children && <div className="adm-head-actions">{children}</div>}
  </div>
);

// صفحه‌بندی سمت کلاینت (بدون تغییر آدرس)
export function AdminPager({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = new Set([1, pages, page, page - 1, page + 1]);
  const list = [...nums].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav className="pagination" aria-label="صفحه‌بندی">
      {page > 1 && (
        <button className="page-btn" onClick={() => onChange(page - 1)}>
          قبلی
        </button>
      )}
      {list.map((n, i) => (
        <span key={n} className="page-wrap">
          {i > 0 && n - list[i - 1] > 1 && <span className="page-gap">…</span>}
          <button className={`page-btn ${n === page ? "active" : ""}`} onClick={() => onChange(n)} aria-current={n === page ? "page" : undefined}>
            {faNum(n)}
          </button>
        </span>
      ))}
      {page < pages && (
        <button className="page-btn" onClick={() => onChange(page + 1)}>
          بعدی
        </button>
      )}
    </nav>
  );
}

export const TableSkeleton = ({ rows = 6 }) => (
  <div className="adm-skel">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />
    ))}
  </div>
);

// دیبانس ساده برای جستجو
export function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
