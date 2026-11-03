import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import Gallery from "@/components/Gallery";
import ProductCard from "@/components/ProductCard";
import { IconShield, IconTruck } from "@/components/Icons";
import { ApiError, getProduct, getProducts, getShipping } from "@/lib/api";
import { SITE_NAME, SITE_URL, genderLabel } from "@/lib/constants";
import { toman } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { shippingMessage } from "@/lib/shipping";

const decode = (v) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

const load = async (slugOrId) => {
  try {
    return await getProduct(decode(slugOrId));
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await load(slug).catch(() => null);
  if (!res) return { title: "محصول پیدا نشد", robots: { index: false } };

  const p = res.product;
  const path = productPath(p);
  const desc = (p.description || `${p.title} با قیمت ${toman(p.finalPrice)} تومان از ${SITE_NAME}`).replace(/\s+/g, " ").trim().slice(0, 160);
  const images = p.images?.[0] ? [{ url: p.images[0], alt: p.title }] : [];

  return {
    title: p.title,
    description: desc,
    alternates: { canonical: path },
    // پیش‌نمایش لینک در دایرکت/استوری اینستاگرام، تلگرام و واتساپ از همین تگ‌ها ساخته می‌شود
    openGraph: { title: p.title, description: desc, url: path, siteName: SITE_NAME, locale: "fa_IR", type: "website", images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title: p.title, description: desc, images: images.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const res = await load(slug);
  if (!res) notFound();
  const p = res.product;

  // آدرس استاندارد (canonical) همیشه با slug فعلی است: لینک قدیمی با id یا با slug قبلی به آن ریدایرکت می‌شود
  if (p.slug && decode(slug) !== p.slug) permanentRedirect(productPath(p));

  const [shipping, related] = await Promise.all([
    getShipping(),
    getProducts({ category: p.category, limit: 5 }, 120)
      .then((r) => r.products.filter((x) => x.id !== p.id).slice(0, 4))
      .catch(() => []),
  ]);

  const url = `${SITE_URL}${productPath(p)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.title,
      url,
      image: p.images,
      description: p.description || undefined,
      category: p.category || undefined,
      brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "IRR",
        price: String(p.finalPrice * 10),
        availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "فروشگاه", item: `${SITE_URL}/shop` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];

  return (
    <div className="container section-sm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="crumbs" aria-label="مسیر">
        <Link href="/">خانه</Link>
        <span>/</span>
        <Link href="/shop">فروشگاه</Link>
        {p.category && (
          <>
            <span>/</span>
            <Link href={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link>
          </>
        )}
      </nav>

      <div className="pdp">
        <Gallery images={p.images} title={p.title} />

        <div className="pdp-info">
          <div className="pdp-tags">
            {p.brand && <span className="pill pill-static">{p.brand}</span>}
            {genderLabel(p.gender) && <span className="pill pill-static">{genderLabel(p.gender)}</span>}
          </div>
          <h1>{p.title}</h1>

          <AddToCart product={p} />

          <ul className="assure">
            <li>
              <IconTruck /> <span>{shippingMessage(shipping)}</span>
            </li>
            <li>
              <IconShield /> <span>پرداخت امن با درگاه زیبال؛ بدون نیاز به ثبت‌نام</span>
            </li>
          </ul>

          {p.description && (
            <details className="acc" open>
              <summary>توضیحات محصول</summary>
              <p className="desc">{p.description}</p>
            </details>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>شاید خوشت بیاد</h2>
            <Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="more">
              بیشتر از «{p.category}»
            </Link>
          </div>
          <div className="grid">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
