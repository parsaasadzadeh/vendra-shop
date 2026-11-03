"use client";

export default function Error({ error, reset }) {
  return (
    <div className="container section">
      <div className="empty big">
        <h1>مشکلی پیش آمد</h1>
        <p>{error?.message || "ارتباط با سرور برقرار نشد."}</p>
        <button className="btn btn-primary btn-lg" onClick={reset}>
          تلاش دوباره
        </button>
      </div>
    </div>
  );
}
