import { NextResponse } from "next/server";

/*
  لینک‌های قدیمی محصول با id (/product/64f1…) را قبل از رندر صفحه، با ریدایرکت دائمی ۳۰۸
  به آدرس slug می‌برد. (ریدایرکتی که داخل خود صفحه انجام شود به‌خاطر استریم، کد ۲۰۰ و متا-ریدایرکت می‌شود
  و برای گوگل ضعیف‌تر است.) برای slugهای معمولی هیچ درخواستی به بک‌اند زده نمی‌شود.
*/
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const config = { matcher: "/product/:key" };

export async function middleware(req) {
  const key = req.nextUrl.pathname.split("/")[2] || "";
  if (!OBJECT_ID.test(key)) return NextResponse.next();

  try {
    const res = await fetch(`${API}/api/products/${key}`, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const { product } = await res.json();
      if (product?.slug) {
        const url = req.nextUrl.clone();
        url.pathname = `/product/${encodeURIComponent(product.slug)}`;
        return NextResponse.redirect(url, 308);
      }
    }
  } catch {
    /* بک‌اند در دسترس نیست: صفحه‌ی خود محصول تصمیم می‌گیرد */
  }
  return NextResponse.next();
}
