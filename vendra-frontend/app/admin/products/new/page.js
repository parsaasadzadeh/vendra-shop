"use client";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { PageHead } from "@/components/admin/ui";
import { IconArrowLeft } from "@/components/Icons";

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="adm-back">
        <IconArrowLeft size={16} style={{ transform: "scaleX(-1)" }} />
        محصولات
      </Link>
      <PageHead title="محصول جدید" subtitle="اطلاعات، عکس‌ها و موجودی هر سایز/رنگ را وارد کنید" />
      <ProductForm />
    </>
  );
}
