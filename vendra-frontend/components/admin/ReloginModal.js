"use client";
import { useState } from "react";
import { useAdmin } from "@/context/AdminProvider";
import { useToast } from "@/context/Providers";
import { ErrorBox } from "./ui";

// وقتی نشست وسط کار تمام شود، فرم‌ها پاک نمی‌شوند؛ فقط همین پنجره باز می‌شود
export default function ReloginModal() {
  const { admin, login, logout } = useAdmin();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      await login(admin.username, password);
      setPassword("");
      toast("دوباره وارد شدید؛ کارتان را ادامه دهید");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-modal-wrap" role="dialog" aria-modal="true" aria-labelledby="relogin-title">
      <form className="adm-modal" onSubmit={submit}>
        <h2 id="relogin-title">نشست شما تمام شد</h2>
        <p className="muted">
          اطلاعاتی که در فرم‌ها وارد کرده‌اید پاک نشده است. برای ادامه، رمز عبور <b dir="ltr">{admin?.username}</b> را دوباره وارد کنید و سپس دکمه‌ی ذخیره را بزنید.
        </p>
        <ErrorBox>{error}</ErrorBox>
        <label className="field">
          <span>رمز عبور</span>
          <input type="password" autoFocus autoComplete="current-password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <div className="adm-modal-actions">
          <button className="btn btn-primary" type="submit" disabled={busy || !password}>
            {busy ? "در حال ورود…" : "ورود دوباره"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            خروج
          </button>
        </div>
      </form>
    </div>
  );
}
