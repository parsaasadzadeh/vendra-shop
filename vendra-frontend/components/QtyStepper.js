"use client";
import { faNum } from "@/lib/format";
import { IconMinus, IconPlus } from "./Icons";

export default function QtyStepper({ value, onChange, min = 1, max = 20, size = "md" }) {
  return (
    <div className={`qty qty-${size}`} role="group" aria-label="تعداد">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="کم کردن">
        <IconMinus size={16} />
      </button>
      <span aria-live="polite">{faNum(value)}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="زیاد کردن">
        <IconPlus size={16} />
      </button>
    </div>
  );
}
