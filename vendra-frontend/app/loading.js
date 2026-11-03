import { ProductSkeletons } from "@/components/ProductCard";

export default function Loading() {
  return (
    <div className="container section-sm">
      <div className="skeleton sk-line" style={{ width: 200, height: 32, marginBottom: 24 }} />
      <ProductSkeletons count={8} />
    </div>
  );
}
