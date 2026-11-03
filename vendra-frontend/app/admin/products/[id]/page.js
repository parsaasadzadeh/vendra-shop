"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";
import { ErrorBox, PageHead } from "@/components/admin/ui";
import { IconArrowLeft, IconExternal } from "@/components/Icons";
import { getProduct } from "@/lib/adminApi";

export default function EditProductPage({ params }) {
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getProduct(id)
      .then((r) => alive && setProduct(r.product))
      .catch((e) => alive && e.status !== 401 && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <>
      <Link href="/admin/products" className="adm-back">
        <IconArrowLeft size={16} style={{ transform: "scaleX(-1)" }} />
        محصولات
      </Link>

      {error ? (
        <ErrorBox>{error}</ErrorBox>
      ) : !product ? (
        <div className="skeleton" style={{ height: 360 }} />
      ) : (
        <>
          <PageHead title={product.title} subtitle={product.isPublished ? "منتشرشده در فروشگاه" : "پنهان از مشتری (پیش‌نویس)"}>
            {product.isPublished && (
              <a href={`/product/${encodeURIComponent(product.slug || product.id)}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                <IconExternal size={16} />
                مشاهده در فروشگاه
              </a>
            )}
          </PageHead>
          <ProductForm initial={product} />
        </>
      )}
    </>
  );
}
