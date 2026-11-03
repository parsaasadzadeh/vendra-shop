import Link from "next/link";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import ShopFilters, { FilterTrigger, SortSelect } from "@/components/ShopFilters";
import { IconClose } from "@/components/Icons";
import { getCategories, getFacets, getProducts } from "@/lib/api";
import { GENDERS, genderLabel } from "@/lib/constants";
import { faNum, toman } from "@/lib/format";

export const metadata = { title: "فروشگاه", description: "همه‌ی محصولات وندرا؛ با فیلتر دقیق سایز، رنگ و قیمت." };

const FILTER_KEYS = ["search", "category", "gender", "size", "color", "minPrice", "maxPrice", "inStock", "featured"];

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const params = {};
  for (const [k, v] of Object.entries(sp || {})) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) params[k] = val;
  }

  const page = Math.max(parseInt(params.page, 10) || 1, 1);
  const query = { ...params, page, limit: 12 };

  const [data, facets, cats] = await Promise.all([
    getProducts(query, 30).catch((e) => ({ error: e.message, products: [], total: 0, pages: 0, page })),
    getFacets(),
    getCategories().catch(() => ({ categories: [] })),
  ]);

  const activeKeys = FILTER_KEYS.filter((k) => params[k]);
  const hrefWithout = (key) => {
    const n = new URLSearchParams(params);
    n.delete(key);
    n.delete("page");
    if (key === "minPrice" || key === "maxPrice") {
      n.delete("minPrice");
      n.delete("maxPrice");
    }
    const q = n.toString();
    return q ? `/shop?${q}` : "/shop";
  };
  const chipLabel = {
    search: (v) => `جستجو: ${v}`,
    category: (v) => v,
    gender: (v) => genderLabel(v) || v,
    size: (v) => `سایز ${v}`,
    color: (v) => `رنگ ${v}`,
    minPrice: (v) => `از ${toman(v)}`,
    maxPrice: (v) => `تا ${toman(v)}`,
    inStock: () => "فقط موجود",
    featured: () => "پیشنهاد ویژه",
  };
  const title = params.search ? `نتایج «${params.search}»` : params.gender ? genderLabel(params.gender) : "همه محصولات";

  const tabHref = (g) => {
    const n = new URLSearchParams(params);
    n.delete("page");
    if (g) n.set("gender", g);
    else n.delete("gender");
    const q = n.toString();
    return q ? `/shop?${q}` : "/shop";
  };

  return (
    <div className="container section-sm">
      <div className="page-head">
        <h1>{title}</h1>
        <p className="muted">{data.error ? "" : `${faNum(data.total || 0)} محصول`}</p>
      </div>

      <div className="tabs" role="tablist" aria-label="دسته‌بندی جنسیتی">
        <Link href={tabHref("")} className={`tab ${!params.gender ? "active" : ""}`}>همه</Link>
        {GENDERS.map((g) => (
          <Link key={g.value} href={tabHref(g.value)} className={`tab ${params.gender === g.value ? "active" : ""}`}>
            {g.label}
          </Link>
        ))}
      </div>

      <div className="toolbar">
        <FilterTrigger activeCount={activeKeys.length} />
        <SortSelect />
      </div>

      {activeKeys.length > 0 && (
        <div className="chips">
          {activeKeys.map((k) => (
            <Link key={k} href={hrefWithout(k)} className="chip" aria-label={`حذف فیلتر ${chipLabel[k](params[k])}`}>
              {chipLabel[k](params[k])} <IconClose size={14} />
            </Link>
          ))}
          <Link href="/shop" className="link-btn">حذف همه</Link>
        </div>
      )}

      <div className="shop-layout">
        <ShopFilters facets={facets} categories={cats.categories || []} activeCount={activeKeys.length} />
        <div className="shop-results">
          {data.error ? (
            <div className="empty">
              <p>{data.error}</p>
              <Link href="/shop" className="btn btn-primary">تلاش دوباره</Link>
            </div>
          ) : data.products.length === 0 ? (
            <div className="empty">
              <p>محصولی با این مشخصات پیدا نشد.</p>
              <Link href="/shop" className="btn btn-primary">دیدن همه محصولات</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-shop">
                {data.products.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 3} />
                ))}
              </div>
              <Pagination page={data.page || page} pages={data.pages || 1} params={params} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
