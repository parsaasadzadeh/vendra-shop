"use client";
import { useState } from "react";
import { ErrorBox, Field, PageHead } from "@/components/admin/ui";
import { useAdmin } from "@/context/AdminProvider";
import { useToast } from "@/context/Providers";
import { adminChangePassword } from "@/lib/adminApi";

export default function AdminAccountPage() {
  const { admin, applySession } = useAdmin();
  const toast = useToast();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const problem =
    next && next.length < 12
      ? "حداقل ۱۲ کاراکتر"
      : next && (!/[A-Za-z]/.test(next) || !/\d/.test(next))
        ? "باید هم حرف انگلیسی و هم عدد داشته باشد"
        : next && admin && next.toLowerCase().includes(admin.username.toLowerCase())
          ? "نباید شامل نام کاربری باشد"
          : "";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (problem) return setError(problem);
    if (next !== again) return setError("تکرار رمز جدید یکسان نیست");
    setBusy(true);
    try {
      const r = await adminChangePassword(cur, next);
      // رمز که عوض شود همه‌ی نشست‌های دیگر باطل می‌شوند؛ توکن جدید همین دستگاه را وارد نگه می‌دارد
      applySession(r.token, r.admin);
      setCur("");
      setNext("");
      setAgain("");
      toast("رمز عبور تغییر کرد؛ دستگاه‌های دیگر خارج شدند");
    } catch (err) {
      if (err.status !== 401) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="حساب و رمز عبور" subtitle={admin ? `نام کاربری: ${admin.username}` : ""} />
      <form className="panel adm-narrow" onSubmit={submit}>
        <h2>تغییر رمز عبور</h2>
        <ErrorBox>{error}</ErrorBox>
        <div className="adm-stack">
          <Field label="رمز فعلی">
            <input dir="ltr" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
          </Field>
          <Field label="رمز جدید" error={problem} hint="حداقل ۱۲ کاراکتر، شامل حرف انگلیسی و عدد">
            <input dir="ltr" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field label="تکرار رمز جدید" error={again && next !== again ? "یکسان نیست" : ""}>
            <input dir="ltr" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          </Field>
          <button className="btn btn-primary" disabled={busy || !cur || !next || !again}>
            {busy ? "در حال ذخیره…" : "تغییر رمز"}
          </button>
        </div>
        <p className="muted small" style={{ marginTop: 14 }}>با تغییر رمز، همه‌ی دستگاه‌های دیگری که وارد شده‌اند خارج می‌شوند.</p>
      </form>
    </>
  );
}
