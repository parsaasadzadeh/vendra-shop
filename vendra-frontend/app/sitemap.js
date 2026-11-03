import { getProductSlugs, getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap() {
  const base = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
  ];

  const entry = (slug, lastModified) => ({
    url: `${SITE_URL}/product/${encodeURIComponent(slug)}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  });

  try {
    // همه‌ی محصولات منتشرشده (قبلاً فقط ۵۰ محصول اول در sitemap بود)
    const { slugs } = await getProductSlugs(3600);
    return [...base, ...slugs.map((s) => entry(s.slug, s.updatedAt))];
  } catch {
    // بک‌اند قدیمی (بدون /products/slugs)
    try {
      const { products } = await getProducts({ limit: 50 }, 3600);
      return [...base, ...products.map((p) => entry(p.slug || p.id, p.createdAt))];
    } catch {
      return base;
    }
  }
}
