import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container section">
      <div className="empty big">
        <div className="big-num">۴۰۴</div>
        <h1>این صفحه پیدا نشد</h1>
        <p>ممکن است آدرس را اشتباه وارد کرده باشید یا محصول دیگر موجود نباشد.</p>
        <Link href="/shop" className="btn btn-primary btn-lg">
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  );
}
