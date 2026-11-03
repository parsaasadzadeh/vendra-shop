const nf = new Intl.NumberFormat("fa-IR");

export const faNum = (n) => nf.format(Number(n) || 0);
export const toman = (n) => nf.format(Math.round(Number(n) || 0));

export const faDate = (d) => {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
  } catch {
    return "";
  }
};

export const toEnDigits = (v) =>
  String(v ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

export const discountPercent = (p) =>
  p && p.hasDiscount && p.price > 0 ? Math.round((1 - p.finalPrice / p.price) * 100) : 0;
