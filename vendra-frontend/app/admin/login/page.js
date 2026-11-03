"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdmin } from "@/context/AdminProvider";
import { ErrorBox } from "@/components/admin/ui";
import { Logo } from "@/components/Icons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, admin, login } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // فقط به مسیرهای داخل پنل برمی‌گردیم (جلوگیری از open redirect)
  const rawNext = params.get("next") || "";
  const next = rawNext.startsWith("/admin") && !rawNext.startsWith("//") && !rawNext.startsWith("/admin/login") ? rawNext : "/admin";

  useEffect(() => {
    if (ready && admin) router.replace(next);
  }, [ready, admin, next, router]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await login(username.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="adm-login panel" onSubmit={submit}>
      <div className="adm-login-logo">
        <Logo size={52} />
        <h1>ورود به پنل مدیریت</h1>
        <p className="muted">وندرا</p>
      </div>
      <ErrorBox>{error}</ErrorBox>
      <label className="field">
        <span>نام کاربری</span>
        <input dir="ltr" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span>رمز عبور</span>
        <input dir="ltr" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button className="btn btn-primary btn-lg btn-block" disabled={busy || !username.trim() || !password}>
        {busy ? "در حال ورود…" : "ورود"}
      </button>
      <p className="muted small" style={{ textAlign: "center" }}>
        پس از ۵ بار رمز اشتباه، حساب ۱۵ دقیقه قفل می‌شود.
      </p>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
