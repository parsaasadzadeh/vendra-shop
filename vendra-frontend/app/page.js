import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { IconArrowLeft, IconSpark } from "@/components/Icons";
import { getCategories, getProducts, getShipping } from "@/lib/api";
import { toman } from "@/lib/format";
import { productPath } from "@/lib/paths";

export const revalidate = 60;

const safe = async (fn, fallback) => {
  try {
    return await fn();
  } catch {
    return fallback;
  }
};

const TILES = [
  { href: "/shop?gender=men", title: "مردانه", sub: "استایل روزمره تا رسمی", cls: "tile-a" },
  { href: "/shop?gender=women", title: "زنانه", sub: "رنگ، طرح و راحتی", cls: "tile-b" },
  { href: "/shop?gender=kids", title: "بچگانه", sub: "نرم، شاد و بادوام", cls: "tile-c" },
];

export default async function HomePage() {
  const [featured, newest, cats, shipping] = await Promise.all([
    safe(() => getProducts({ featured: "true", limit: 8 }), { products: [] }),
    safe(() => getProducts({ sort: "newest", limit: 8 }), { products: [] }),
    safe(() => getCategories(), { categories: [] }),
    getShipping(),
  ]);

  // سومین آمار بالای صفحه از تنظیمات ارسالِ فروشنده می‌آید
  const shipStat =
    shipping.price === 0
      ? { value: "رایگان", label: "ارسال همه‌ی سفارش‌ها" }
      : shipping.freeThreshold > 0
        ? { value: toman(shipping.freeThreshold), label: "تومان؛ ارسال رایگان" }
        : { value: toman(shipping.price), label: "تومان؛ هزینه‌ی ارسال" };

  const hero = [...featured.products, ...newest.products].filter((p, i, a) => p.images?.[0] && a.findIndex((x) => x.id === p.id) === i).slice(0, 3);
  const showFeatured = featured.products.length > 0 ? featured.products : [];
  const offers = newest.products.filter((p) => p.hasDiscount).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              <IconSpark size={16} /> کالکشن جدید وندرا
            </span>
            <h1>
              استایل خودت رو
              <br />
              <em>پیدا کن</em>، بدون دردسر.
            </h1>
            <p>
              سایز و رنگ دقیق، موجودی واقعی و خریدی که فقط چند دقیقه طول می‌کشد؛ بدون ثبت‌نام و با پرداخت امن.
            </p>
            <div className="hero-cta">
              <Link href="/shop" className="btn btn-primary btn-lg">
                مشاهده محصولات <IconArrowLeft size={20} />
              </Link>
              <Link href="/shop?featured=true" className="btn btn-ghost btn-lg">
                پیشنهاد ویژه
              </Link>
            </div>
            <ul className="hero-stats">
              <li><b>۱۰۰٪</b><span>موجودی لحظه‌ای</span></li>
              <li><b>بدون ثبت‌نام</b><span>خرید مهمان</span></li>
              <li><b>{shipStat.value}</b><span>{shipStat.label}</span></li>
            </ul>
          </div>

      <div className="hero-art" aria-hidden="true">
  <div className="hero-figure">
    <div className="hero-orb" />
    <Image
      src="/vendrashop.png"
      alt=""
      fill
      priority
      sizes="(max-width: 900px) 460px, 36vw"
      className="hero-character"
    />
  </div>
</div>
        </div>
      </section>

      <section className="container section">
        <div className="tiles">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className={`tile ${t.cls}`}>
              <span className="tile-sub">{t.sub}</span>
              <b>{t.title}</b>
              <span className="tile-go">
                مشاهده <IconArrowLeft size={18} />
              </span>
            </Link>
          ))}
        </div>

        {cats.categories?.length > 0 && (
          <div className="cat-strip" aria-label="دسته‌بندی‌ها">
            {cats.categories.map((c) => (
              <Link key={c} href={`/shop?category=${encodeURIComponent(c)}`} className="pill">
                {c}
              </Link>
            ))}
          </div>
        )}
      </section>

      {showFeatured.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <div>
              <span className="eyebrow soft">انتخاب ما</span>
              <h2>پیشنهاد ویژه</h2>
            </div>
            <Link href="/shop?featured=true" className="more">
              همه موارد <IconArrowLeft size={18} />
            </Link>
          </div>
          <div className="grid">
            {showFeatured.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      <section className="container section">
        <div className="section-head">
          <div>
            <span className="eyebrow soft">تازه‌ها</span>
            <h2>جدیدترین‌ها</h2>
          </div>
          <Link href="/shop" className="more">
            مشاهده همه <IconArrowLeft size={18} />
          </Link>
        </div>
        {newest.products.length > 0 ? (
          <div className="grid">
            {newest.products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>هنوز محصولی اضافه نشده یا اتصال به سرور برقرار نیست.</p>
          </div>
        )}
      </section>

      {offers.length > 0 && (
        <section className="container section">
          <div className="promo">
            <div>
              <span className="eyebrow">فرصت محدود</span>
              <h2>تخفیف‌های وندرا</h2>
              <p>تا تمام نشده، کالاهای تخفیف‌دار رو ببین.</p>
              <Link href="/shop?sort=price_asc" className="btn btn-light">
                دیدن تخفیف‌ها
              </Link>
            </div>
            <div className="promo-items">
              {offers.slice(0, 3).map((p) => (
                <Link key={p.id} href={productPath(p)} className="promo-item">
                  {p.images?.[0] && <Image src={p.images[0]} alt={p.title} fill sizes="160px" />}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
