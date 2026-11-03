"use client";
import { useRef, useState } from "react";
import { IconClose, IconImage } from "@/components/Icons";
import { MAX_IMAGES, compressImage, prettySize } from "@/lib/image";
import { faNum } from "@/lib/format";

// عکس‌های انتخاب‌شده همان لحظه فشرده می‌شوند و منتظر ذخیره‌ی محصول می‌مانند
export default function ImagePicker({ staged, onChange, existingCount = 0, disabled = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const room = MAX_IMAGES - existingCount - staged.length;

  const pick = async (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    setProblem("");
    if (files.length > room) setProblem(`حداکثر ${faNum(MAX_IMAGES)} عکس برای هر محصول مجاز است؛ ${faNum(Math.max(room, 0))} عکس دیگر می‌توانی اضافه کنی.`);
    setBusy(true);
    const added = [];
    const errors = [];
    for (const f of files.slice(0, Math.max(room, 0))) {
      try {
        const file = await compressImage(f);
        added.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file, preview: URL.createObjectURL(file) });
      } catch (e) {
        errors.push(e.message);
      }
    }
    if (errors.length) setProblem((p) => [p, ...errors].filter(Boolean).join(" • "));
    if (added.length) onChange([...staged, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id) => {
    const x = staged.find((s) => s.id === id);
    if (x) URL.revokeObjectURL(x.preview);
    onChange(staged.filter((s) => s.id !== id));
  };
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= staged.length) return;
    const copy = [...staged];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <div>
      {staged.length > 0 && (
        <ul className="adm-imgs">
          {staged.map((s, i) => (
            <li key={s.id} className="adm-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.preview} alt="" />
              <span className="adm-img-size">{prettySize(s.file.size)}</span>
              <button type="button" className="adm-img-x" onClick={() => remove(s.id)} aria-label="حذف عکس" disabled={disabled}>
                <IconClose size={14} />
              </button>
              <div className="adm-img-move">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || disabled} aria-label="جلوتر">›</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === staged.length - 1 || disabled} aria-label="عقب‌تر">‹</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className={`adm-drop ${room <= 0 || disabled ? "is-disabled" : ""}`}>
        <IconImage size={26} />
        <b>{busy ? "در حال فشرده‌سازی…" : "انتخاب عکس"}</b>
        <span className="muted small">jpg، png یا webp · خودکار فشرده می‌شود · {faNum(Math.max(room, 0))} جای خالی</span>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || room <= 0 || disabled} onChange={(e) => pick(e.target.files)} />
      </label>
      {problem && <p className="hint-error" style={{ marginTop: 8 }}>{problem}</p>}
    </div>
  );
}
