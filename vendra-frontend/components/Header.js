"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, useShipping } from "@/context/Providers";
import { SITE_NAME, SITE_NAME_EN } from "@/lib/constants";
import { shippingMessage } from "@/lib/shipping";
import { IconBag, IconClose, IconMenu, IconSearch, IconBox, Logo } from "./Icons";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/shop", label: "همه محصولات" },
  { href: "/shop?gender=men", label: "مردانه" },
  { href: "/shop?gender=women", label: "زنانه" },
  { href: "/shop?gender=kids", label: "بچگانه" },
  { href: "/shop?featured=true", label: "پیشنهاد ویژه" },
];

export default function Header() {
  const { count, openDrawer } = useCart();
  const shipping = useShipping();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenu(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/shop?search=${encodeURIComponent(term)}`);
    setSearchOpen(false);
  };

  return (
    <>
      <div className="announce">
        <span>{shippingMessage(shipping)}</span>
        <span className="announce-dot" aria-hidden="true" />
        <span className="hide-sm">خرید بدون نیاز به ثبت‌نام</span>
      </div>

      <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header-inner">
          <button className="icon-btn only-mobile" onClick={() => setMenu(true)} aria-label="منو">
            <IconMenu />
          </button>

          <Link href="/" className="brand" aria-label={`${SITE_NAME} - صفحه اصلی`}>
            <Logo />
            <span className="brand-text">
              <b>{SITE_NAME}</b>
              <small>{SITE_NAME_EN}</small>
            </span>
          </Link>

          <nav className="nav only-desktop" aria-label="منوی اصلی">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="nav-link">
                {n.label}
              </Link>
            ))}
          </nav>

          <form className="search only-desktop" onSubmit={submit} role="search">
            <IconSearch size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در وندرا…" aria-label="جستجو" />
          </form>

          <div className="header-actions">
            <button className="icon-btn only-mobile" onClick={() => setSearchOpen((s) => !s)} aria-label="جستجو">
              {searchOpen ? <IconClose /> : <IconSearch />}
            </button>
            <Link href="/track" className="icon-btn only-desktop" aria-label="پیگیری سفارش" title="پیگیری سفارش">
              <IconBox />
            </Link>
            <ThemeToggle />
            <button className="icon-btn cart-btn" onClick={openDrawer} aria-label={`سبد خرید، ${count} کالا`}>
              <IconBag />
              {count > 0 && <span className="badge-count">{count > 99 ? "۹۹+" : new Intl.NumberFormat("fa-IR").format(count)}</span>}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form className="mobile-search container" onSubmit={submit} role="search">
            <IconSearch size={18} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="دنبال چی می‌گردی؟" aria-label="جستجو" />
            <button className="btn btn-primary btn-sm" type="submit">
              جستجو
            </button>
          </form>
        )}
      </header>

      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <aside className={`mobile-menu ${menu ? "open" : ""}`} aria-hidden={!menu}>
        <div className="mobile-menu-head">
          <Link href="/" className="brand">
            <Logo size={30} />
            <span className="brand-text">
              <b>{SITE_NAME}</b>
            </span>
          </Link>
          <button className="icon-btn" onClick={() => setMenu(false)} aria-label="بستن">
            <IconClose />
          </button>
        </div>
        <nav className="mobile-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="/track">پیگیری سفارش</Link>
          <Link href="/cart">سبد خرید</Link>
        </nav>
      </aside>
    </>
  );
}
