"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { GENDERS } from "@/lib/constants";
import { IconTrash } from "@/components/Icons";
import { useToast } from "@/context/Providers";
import { createProduct, deleteProductImage, updateProduct } from "@/lib/adminApi";
import { MAX_VARIANTS, variantKey } from "@/lib/adminConstants";
import { faNum, toEnDigits, toman } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { batchFiles } from "@/lib/image";
import { ErrorBox, Field } from "./ui";
import ImagePicker from "./ImagePicker";
import { VariantsCreate, VariantsManage, rowPayload } from "./VariantRows";
import { normSize } from "./VariantGenerator";

const digits = (v) => toEnDigits(v).replace(/[^\d]/g, "").slice(0, 10);

const initialFields = (p) => ({
  title: p?.title || "",
  slug: p?.slug || "",
  price: p ? String(p.price) : "",
  discountPrice: p && p.discountPrice > 0 ? String(p.discountPrice) : "",
  description: p?.description || "",
  category: p?.category || "",
  brand: p?.brand || "",
  gender: p?.gender || "unisex",
  isPublished: p ? p.isPublished : true,
  isFeatured: p ? p.isFeatured : false,
});

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="switch-row adm-toggle">
    <span>
      {label}
      {hint && <small className="muted" style={{ display: "block", fontWeight: 500 }}>{hint}</small>}
    </span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="switch" aria-hidden="true" />
  </label>
);

export default function ProductForm({ initial = null }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(initial);
  const topRef = useRef(null);

  const [product, setProduct] = useState(initial); // نمای ادمین (فقط در حالت ویرایش)
  const [f, setF] = useState(() => initialFields(initial));
  const [staged, setStaged] = useState([]);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");

  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const price = Number(f.price || 0);
  const discount = Number(f.discountPrice || 0);

  // آدرس صفحه: در محصول جدید اگر خالی بماند سرور از نام محصول می‌سازد (و در صورت تکراری بودن شماره اضافه می‌کند)
  const slugClean = slugify(f.slug);
  const slugSuggest = slugify(f.title);
  const slugChanged = isEdit && slugClean && slugClean !== (product?.slug || "");

  const validate = () => {
    const e = {};
    if (f.title.trim().length < 2) e.title = "نام محصول را وارد کنید";
    if (!f.price || price <= 0) e.price = "قیمت را وارد کنید";
    if (f.discountPrice && discount > 0 && discount >= price) e.discountPrice = "قیمت با تخفیف باید کمتر از قیمت اصلی باشد";

    if (!isEdit) {
      const filled = rows.filter((r) => r.size.trim() || r.colorName.trim() || r.sku.trim());
      if (filled.length === 0) e.variants = "حداقل یک سایز/رنگ با موجودی اضافه کنید";
      else if (filled.some((r) => !normSize(r.size))) e.variants = "برای همه‌ی ردیف‌ها سایز را وارد کنید";
      else if (new Set(filled.map((r) => variantKey({ size: normSize(r.size), colorName: r.colorName }))).size !== filled.length) e.variants = "ترکیب سایز و رنگ تکراری وارد شده است";
      else if (filled.length > MAX_VARIANTS) e.variants = `حداکثر ${faNum(MAX_VARIANTS)} ترکیب مجاز است`;
    }
    setErrors(e);
    return e;
  };

  const baseFields = () => ({
    title: f.title.trim(),
    price: price,
    discountPrice: discount > 0 ? discount : 0,
    description: f.description.trim(),
    category: f.category.trim(),
    brand: f.brand.trim(),
    gender: f.gender,
    isPublished: f.isPublished,
    isFeatured: f.isFeatured,
    // فقط وقتی ادمین صریحاً آدرس را نوشته/عوض کرده بفرستیم؛ وگرنه سرور خودش مدیریت می‌کند
    ...(isEdit ? (slugChanged ? { slug: slugClean } : {}) : slugClean ? { slug: slugClean } : {}),
  });

  const toForm = (files, fields) => {
    const fd = new FormData();
    if (fields) Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
    files.forEach((file) => fd.append("images", file, file.name));
    return fd;
  };

  const fail = (msg) => {
    setError(msg);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // عکس‌های باقی‌مانده را دسته‌دسته می‌فرستد (محدودیت حجم بدنه‌ی درخواست روی Vercel)
  const uploadRest = async (id, batches) => {
    let last = null;
    for (let i = 0; i < batches.length; i++) {
      setStep(`آپلود عکس‌ها (${faNum(i + 1)} از ${faNum(batches.length + 1)})…`);
      const r = await updateProduct(id, toForm(batches[i], null));
      last = r.product;
    }
    return last;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setError("");
    const e = validate();
    if (Object.keys(e).length) return fail("لطفاً خطاهای مشخص‌شده را اصلاح کنید");

    setBusy(true);
    const stagedBatches = batchFiles(staged.map((s) => s.file));
    // اولین دسته همراه خود محصول می‌رود، بقیه بعداً
    const firstBatch = stagedBatches[0] || [];
    const rest = stagedBatches.slice(1);

    try {
      if (!isEdit) {
        const variants = rows.filter((r) => r.size.trim() || r.colorName.trim() || r.sku.trim()).map(rowPayload);
        setStep("در حال ثبت محصول…");
        const fields = { ...baseFields(), variants: JSON.stringify(variants) };
        if (!fields.discountPrice) delete fields.discountPrice;
        const created = await createProduct(toForm(firstBatch, fields));
        const id = created.product.id;

        if (rest.length) {
          try {
            await uploadRest(id, rest);
          } catch (err) {
            toast("محصول ساخته شد ولی آپلود بعضی عکس‌ها ناموفق بود؛ از همین صفحه دوباره اضافه کنید", "error");
            router.replace(`/admin/products/${id}`);
            return;
          }
        }
        toast("محصول ایجاد شد");
        router.push("/admin/products");
        return;
      }

      // ویرایش: فیلدهای محصول (+ اولین دسته‌ی عکس)
      setStep("در حال ذخیره…");
      let updated;
      if (firstBatch.length) {
        updated = (await updateProduct(product.id, toForm(firstBatch, baseFields()))).product;
      } else {
        updated = (await updateProduct(product.id, baseFields())).product;
      }
      if (rest.length) updated = (await uploadRest(product.id, rest)) || updated;

      staged.forEach((s) => URL.revokeObjectURL(s.preview));
      setStaged([]);
      setProduct(updated);
      setF(initialFields(updated));
      toast("تغییرات ذخیره شد");
    } catch (err) {
      if (err.status !== 401) fail(err.message);
    } finally {
      setBusy(false);
      setStep("");
    }
  };

  const removeExistingImage = async (url) => {
    if (!window.confirm("این عکس برای همیشه حذف شود؟")) return;
    setError("");
    try {
      const r = await deleteProductImage(product.id, url);
      setProduct(r.product);
      toast("عکس حذف شد");
    } catch (err) {
      if (err.status !== 401) fail(err.message);
    }
  };

  const images = product?.images || [];

  return (
    <>
    <form
      className="adm-form"
      onSubmit={submit}
      noValidate
      onKeyDown={(e) => {
        // Enter داخل فیلدها نباید ناخواسته محصول را ذخیره کند
        if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "submit") e.preventDefault();
      }}
    >
      <span ref={topRef} />
      <ErrorBox>{error}</ErrorBox>

      <section className="panel">
        <h2>اطلاعات اصلی</h2>
        <div className="form-grid">
          <Field label="نام محصول" error={errors.title} wide>
            <input value={f.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} placeholder="مثلاً: تی‌شرت نخی یقه گرد" />
          </Field>

          <Field
            label="آدرس صفحه‌ی محصول (slug)"
            wide
            hint={
              isEdit
                ? "با تغییر آدرس، لینک قبلی هم کار می‌کند و به آدرس جدید منتقل می‌شود"
                : "اختیاری؛ خالی بگذارید تا از نام محصول ساخته شود. برای لینک کوتاه‌تر می‌توانید انگلیسی بنویسید"
            }
          >
            <input
              dir="ltr"
              value={f.slug}
              maxLength={100}
              onChange={(e) => set({ slug: e.target.value })}
              placeholder={slugSuggest || "tshirt-cotton"}
              autoCapitalize="none"
              spellCheck={false}
            />
            <span className="slug-preview">
              /product/{slugClean || slugSuggest || "…"}
              {slugChanged ? "  (تغییر می‌کند)" : ""}
            </span>
          </Field>

          <Field label="قیمت (تومان)" error={errors.price} hint={price > 0 ? `${toman(price)} تومان` : ""}>
            <input dir="ltr" inputMode="numeric" value={f.price} onChange={(e) => set({ price: digits(e.target.value) })} placeholder="1200000" />
          </Field>

          <Field label="قیمت با تخفیف (تومان)" error={errors.discountPrice} hint={discount > 0 && discount < price ? `٪${faNum(Math.round((1 - discount / price) * 100))} تخفیف` : "اگر تخفیف ندارد خالی بگذارید"}>
            <input dir="ltr" inputMode="numeric" value={f.discountPrice} onChange={(e) => set({ discountPrice: digits(e.target.value) })} placeholder="مثلاً 990000" />
          </Field>

          <Field label="دسته‌بندی" hint="اگر خالی باشد «عمومی» ثبت می‌شود">
            <input value={f.category} maxLength={60} onChange={(e) => set({ category: e.target.value })} placeholder="مثلاً: تی‌شرت" />
          </Field>

          <Field label="برند">
            <input value={f.brand} maxLength={60} onChange={(e) => set({ brand: e.target.value })} />
          </Field>

          <Field label="مناسب برای">
            <div className="select-wrap">
              <select value={f.gender} onChange={(e) => set({ gender: e.target.value })} style={{ width: "100%", borderRadius: 14 }}>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="توضیحات" wide hint={`${faNum(f.description.length)} از ${faNum(5000)}`}>
            <textarea rows={5} maxLength={5000} value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="جنس، اندازه، نحوه‌ی شست‌وشو و …" />
          </Field>
        </div>
        <div className="adm-toggles">
          <Toggle label="نمایش در فروشگاه" hint="خاموش = پیش‌نویس؛ مشتری نمی‌بیند" checked={f.isPublished} onChange={(v) => set({ isPublished: v })} />
          <Toggle label="پیشنهاد ویژه" hint="در صفحه‌ی اصلی نمایش داده می‌شود" checked={f.isFeatured} onChange={(v) => set({ isFeatured: v })} />
        </div>
      </section>

      <section className="panel">
        <h2>عکس‌ها</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          عکس اول، عکس اصلی محصول است و عکس دوم هنگام رفتن موس روی کارت دیده می‌شود. عکس‌ها قبل از ارسال خودکار فشرده می‌شوند.
        </p>

        {isEdit && images.length > 0 && (
          <ul className="adm-imgs">
            {images.map((url, i) => (
              <li key={url} className="adm-img">
                <Image src={url} alt="" fill sizes="140px" style={{ objectFit: "cover" }} />
                {i === 0 && <span className="adm-img-main">اصلی</span>}
                <button type="button" className="adm-img-x" onClick={() => removeExistingImage(url)} aria-label="حذف عکس">
                  <IconTrash size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <ImagePicker staged={staged} onChange={setStaged} existingCount={images.length} disabled={busy} />
        {isEdit && staged.length > 0 && <p className="muted small" style={{ marginTop: 8 }}>عکس‌های جدید بعد از دکمه‌ی «ذخیره‌ی تغییرات» به انتهای عکس‌های فعلی اضافه می‌شوند.</p>}
      </section>

      {!isEdit && (
        <section className="panel">
          <h2>سایز، رنگ و موجودی</h2>
          <p className="muted small" style={{ marginBottom: 12 }}>هر ترکیب سایز + رنگ، موجودی مخصوص خودش را دارد (مثلاً L قرمز ۵ عدد، XL قرمز ۰ عدد).</p>
          <VariantsCreate rows={rows} setRows={setRows} errors={errors} />
        </section>
      )}

      <div className="adm-savebar">
        <div className="adm-savebar-in">
          <span className="muted small">{busy ? step : isEdit ? "تغییرات اطلاعات و عکس‌ها با این دکمه ذخیره می‌شود" : ""}</span>
          <Link href="/admin/products" className="btn btn-ghost">
            انصراف
          </Link>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "لطفاً صبر کنید…" : isEdit ? "ذخیره‌ی تغییرات" : "ایجاد محصول"}
          </button>
        </div>
      </div>

    </form>

    {isEdit && (
      <section className="panel adm-variants-panel">
        <h2>سایز، رنگ و موجودی</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>تغییرات این بخش جدا از دکمه‌ی «ذخیره‌ی تغییرات» و همان لحظه ثبت می‌شود.</p>
        <VariantsManage product={product} onProduct={setProduct} />
      </section>
    )}
    </>
  );
}
