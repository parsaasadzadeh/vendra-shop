"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminProvider";
import { IconClose, IconDashboard, IconExternal, IconKey, IconLogout, IconMenu, IconBox, IconShirt, IconTruck, Logo } from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";
import ReloginModal from "./ReloginModal";

const NAV = [
  { href: "/admin", label: "داشبورد", icon: IconDashboard, exact: true },
  { href: "/admin/products", label: "محصولات", icon: IconShirt },
  { href: "/admin/orders", label: "سفارش‌ها", icon: IconBox },
  { href: "/admin/shipping", label: "هزینه‌ی ارسال", icon: IconTruck },
  { href: "/admin/account", label: "حساب و رمز عبور", icon: IconKey },
];

const hhmm = (ms) => new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(ms));

export default function AdminShell({ children }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { ready, admin, expired, expiresAt, logout } = useAdmin();
  const [menu, setMenu] = useState(false);

  const isLogin = pathname === "/admin/login";

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    if (ready && !admin && !isLogin) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, admin, isLogin, pathname, router]);

  if (isLogin) return <div className="adm-auth">{children}</div>;

  if (!ready || !admin) {
    return (
      <div className="adm-boot" role="status">
        <div className="skeleton" style={{ width: 160, height: 24 }} />
      </div>
    );
  }

  const isActive = (n) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(`${n.href}/`));

  const confirmLogout = () => {
    if (window.confirm("با خروج، از همه‌ی دستگاه‌هایی که وارد شده‌اید خارج می‌شوید. ادامه می‌دهید؟")) logout();
  };

  return (
    <div className="adm">
      {menu && <div className="scrim show" onClick={() => setMenu(false)} />}
      <aside className={`adm-side ${menu ? "open" : ""}`}>
        <div className="adm-side-head">
          <Link href="/admin" className="brand">
            <Logo size={32} />
            <span className="brand-text">
              <b>پنل وندرا</b>
              <small>مدیریت فروشگاه</small>
            </span>
          </Link>
          <button className="icon-btn only-mobile-flex" onClick={() => setMenu(false)} aria-label="بستن منو">
            <IconClose />
          </button>
        </div>

        <nav className="adm-nav" aria-label="منوی مدیریت">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={isActive(n) ? "active" : ""} aria-current={isActive(n) ? "page" : undefined}>
              <n.icon size={20} />
              {n.label}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener">
            <IconExternal size={20} />
            مشاهده‌ی فروشگاه
          </a>
        </nav>

        <div className="adm-side-foot">
          <div className="adm-me">
            <b dir="ltr">{admin.username}</b>
            {expiresAt > 0 && <small className="muted">نشست تا ساعت {hhmm(expiresAt)}</small>}
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={confirmLogout}>
            <IconLogout size={18} />
            خروج از همه‌ی دستگاه‌ها
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <button className="icon-btn only-mobile-flex" onClick={() => setMenu(true)} aria-label="منو">
            <IconMenu />
          </button>
          <div className="grow" />
          <ThemeToggle />
        </header>
        <div className="adm-content fade-in">{children}</div>
      </div>

      {expired && <ReloginModal />}
    </div>
  );
}
