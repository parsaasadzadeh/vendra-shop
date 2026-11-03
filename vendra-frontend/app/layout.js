import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Providers from "@/context/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Chrome from "@/components/Chrome";
import { SITE_NAME, SITE_NAME_EN, SITE_URL } from "@/lib/constants";
import { getShipping } from "@/lib/api";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_NAME_EN} — فروشگاه آنلاین پوشاک`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "وندرا؛ فروشگاه آنلاین پوشاک با موجودی دقیق سایز و رنگ، خرید بدون ثبت‌نام، پرداخت امن و ارسال سریع به سراسر ایران.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "fa_IR", siteName: SITE_NAME },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0d14" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('vendra_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default async function RootLayout({ children }) {
  const shipping = await getShipping();
  return (
    <html lang="fa" dir="rtl" className={vazir.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers shipping={shipping}>
          <a href="#main" className="skip-link">
            پرش به محتوا
          </a>
          <Chrome header={<Header />} footer={<Footer />} drawer={<CartDrawer />}>
            {children}
          </Chrome>
        </Providers>
      </body>
    </html>
  );
}
