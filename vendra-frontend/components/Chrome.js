"use client";
import { usePathname } from "next/navigation";

// در مسیرهای /admin هدر، فوتر و سبد خرید فروشگاه نمایش داده نمی‌شود
export default function Chrome({ header, footer, drawer, children }) {
  const pathname = usePathname() || "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <main id="main">{children}</main>;
  }
  return (
    <>
      {header}
      <main id="main">{children}</main>
      {footer}
      {drawer}
    </>
  );
}
