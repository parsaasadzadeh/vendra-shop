"use client";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPager, Badge, ErrorBox, PageHead, TableSkeleton, useDebounced } from "@/components/admin/ui";
import { IconEdit, IconSearch, IconTrash } from "@/components/Icons";
import { useToast } from "@/context/Providers";
import { deleteProduct, listProducts } from "@/lib/adminApi";
import { faNum, toman } from "@/lib/format";

const FILTERS = [
  { key: "all", label: "همه", params: {} },
  { key: "published", label: "منتشرشده", params: { isPublished: "true" } },
  { key: "hidden", label: "پنهان", params: { isPublished: "false" } },
  { key: "out", label: "ناموجود", params: { outOfStock: "true" } },
];

function ProductsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();

  const active = sp.get("outOfStock") === "true" ? "out" : sp.get("isPublished") === "false" ? "hidden" : sp.get("isPublished") === "true" ? "published" : "all";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, products: [], total: 0, pages: 1, error: "" });
  const [removing, setRemoving] = useState("");
  const q = useDebounced(search.trim());

  const load = useCallback(() => {
    let alive = true;
    const filter = FILTERS.find((x) => x.key === active);
    setState((s) => ({ ...s, loading: true, error: "" }));
    listProducts({ ...filter.params, search: q, page, limit: 20 })
      .then((r) => alive && setState({ loading: false, products: r.products, total: r.total, pages: r.pages, error: "" }))
      .catch((e) => alive && setState((s) => ({ ...s, loading: false, error: e.status === 401 ? "" : e.message })));
    return () => {
      alive = false;
    };
  }, [active, q, page]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [q]);

  const choose = (f) => {
    const s = new URLSearchParams(f.params).toString();
    router.replace(s ? `/admin/products?${s}` : "/admin/products");
    setPage(1);
  };

  const remove = async (p) => {
    if (!window.confirm(`«${p.title}» حذف شود؟\nاگر در سفارشی استفاده شده باشد، فقط پنهان (آرشیو) می‌شود.`)) return;
    setRemoving(p.id);
    try {
      const r = await deleteProduct(p.id);
      toast(r.message, r.archived ? "error" : "success");
      load();
    } catch (e) {
      if (e.status !== 401) toast(e.message, "error");
    } finally {
      setRemoving("");
    }
  };

  return (
    <>
      <PageHead title="محصولات" subtitle={state.loading ? "" : `${faNum(state.total)} محصول`}>
        <Link href="/admin/products/new" className="btn btn-primary">
          + محصول جدید
        </Link>
      </PageHead>

      <div className="tabs" role="tablist" aria-label="فیلتر محصولات">
        {FILTERS.map((f) => (
          <button key={f.key} role="tab" aria-selected={active === f.key} className={`tab ${active === f.key ? "active" : ""}`} onClick={() => choose(f)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="adm-filters">
        <form className="search adm-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <IconSearch size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی نام محصول" aria-label="جستجو" />
        </form>
      </div>

      <ErrorBox>{state.error}</ErrorBox>

      {state.loading ? (
        <TableSkeleton />
      ) : state.products.length === 0 ? (
        <div className="empty panel">
          <p>محصولی پیدا نشد.</p>
          <Link href="/admin/products/new" className="btn btn-primary">
            ساخت اولین محصول
          </Link>
        </div>
      ) : (
        <ul className="adm-rows panel">
          {state.products.map((p) => (
            <li key={p.id} className="adm-row adm-prow">
              <Link href={`/admin/products/${p.id}`} className="adm-prow-main">
                <div className="adm-thumb">
                  {p.images[0] ? <Image src={p.images[0]} alt="" fill sizes="56px" style={{ objectFit: "cover" }} /> : <span>{p.title[0]}</span>}
                </div>
                <div className="grow">
                  <b className="adm-ptitle">{p.title}</b>
                  <div className="muted small">
                    {p.category}
                    {p.brand ? ` · ${p.brand}` : ""} · {faNum(p.variants.length)} ترکیب سایز/رنگ
                  </div>
                </div>
              </Link>
              <div className="adm-row-end">
                <b>{toman(p.finalPrice)}</b>
                {p.hasDiscount && <span className="old-price small">{toman(p.price)}</span>}
              </div>
              <div className="adm-badges">
                <Badge tone={p.totalStock === 0 ? "danger" : p.totalStock <= 5 ? "warn" : "success"}>
                  {p.totalStock === 0 ? "ناموجود" : `${faNum(p.totalStock)} عدد`}
                </Badge>
                {!p.isPublished && <Badge tone="warn">پنهان</Badge>}
                {p.isFeatured && <Badge tone="info">ویژه</Badge>}
              </div>
              <div className="adm-row-actions">
                <Link href={`/admin/products/${p.id}`} className="icon-btn" aria-label={`ویرایش ${p.title}`} title="ویرایش">
                  <IconEdit size={18} />
                </Link>
                <button className="icon-btn" onClick={() => remove(p)} disabled={removing === p.id} aria-label={`حذف ${p.title}`} title="حذف">
                  <IconTrash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminPager page={page} pages={state.pages} onChange={setPage} />
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ProductsInner />
    </Suspense>
  );
}
