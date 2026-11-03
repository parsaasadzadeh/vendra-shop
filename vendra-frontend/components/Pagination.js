import Link from "next/link";
import { faNum } from "@/lib/format";

export default function Pagination({ page, pages, params }) {
  if (pages <= 1) return null;

  const href = (p) => {
    const sp = new URLSearchParams(params);
    if (p > 1) sp.set("page", String(p));
    else sp.delete("page");
    const q = sp.toString();
    return q ? `/shop?${q}` : "/shop";
  };

  const nums = new Set([1, pages, page, page - 1, page + 1, page - 2, page + 2]);
  const list = [...nums].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  return (
    <nav className="pagination" aria-label="صفحه‌بندی">
      {page > 1 && (
        <Link href={href(page - 1)} className="page-btn" rel="prev">
          قبلی
        </Link>
      )}
      {list.map((n, i) => (
        <span key={n} className="page-wrap">
          {i > 0 && n - list[i - 1] > 1 && <span className="page-gap">…</span>}
          <Link href={href(n)} className={`page-btn ${n === page ? "active" : ""}`} aria-current={n === page ? "page" : undefined}>
            {faNum(n)}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className="page-btn" rel="next">
          بعدی
        </Link>
      )}
    </nav>
  );
}
