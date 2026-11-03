import { SITE_URL } from "@/lib/constants";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/payment", "/track", "/admin"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
