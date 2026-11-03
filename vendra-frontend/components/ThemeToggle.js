"use client";
import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./Icons";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("vendra_theme", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <button className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "حالت روشن" : "حالت تیره"} title="تغییر تم">
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
