import Link from "next/link";
import { SITE_NAME, SITE_NAME_EN } from "@/lib/constants";
import { IconBox, IconShield, IconTruck, IconUser, Logo } from "./Icons";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="perks">
          <div className="perk">
            <IconUser />
            <div>
              <b>خرید بدون ثبت‌نام</b>
              <span>فقط اطلاعات ارسال را وارد کن</span>
            </div>
          </div>
          <div className="perk">
            <IconShield />
            <div>
              <b>پرداخت امن</b>
              <span>از طریق درگاه معتبر زیبال</span>
            </div>
          </div>
          <div className="perk">
            <IconTruck />
            <div>
              <b>ارسال به سراسر ایران</b>
              <span>ارسال رایگان برای سفارش‌های بالا</span>
            </div>
          </div>
          <div className="perk">
            <IconBox />
            <div>
              <b>پیگیری لحظه‌ای</b>
              <span>با کد رهگیری یا شماره موبایل</span>
            </div>
          </div>
        </div>

        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <Logo />
              <span className="brand-text">
                <b>{SITE_NAME}</b>
                <small>{SITE_NAME_EN}</small>
              </span>
            </Link>
            <p>پوشاکی که انتخابش لذت‌بخش است؛ سایز و رنگ دقیق، موجودی واقعی و خریدی بی‌دردسر.</p>
          </div>
          <div className="footer-col">
            <h4>فروشگاه</h4>
            <Link href="/shop">همه محصولات</Link>
            <Link href="/shop?gender=men">مردانه</Link>
            <Link href="/shop?gender=women">زنانه</Link>
            <Link href="/shop?gender=kids">بچگانه</Link>
          </div>
          <div className="footer-col">
            <h4>خریدار</h4>
            <Link href="/cart">سبد خرید</Link>
            <Link href="/track">پیگیری سفارش</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date())} {SITE_NAME}. همه حقوق محفوظ است.</span>
        </div>
      </div>
    </footer>
  );
}
