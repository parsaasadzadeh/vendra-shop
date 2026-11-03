import Image from "next/image";
import Link from "next/link";
import { discountPercent, faNum, toman } from "@/lib/format";
import { genderLabel } from "@/lib/constants";
import { productPath } from "@/lib/paths";

const SIZES_SHOWN = 6;
const COLORS_SHOWN = 4;
const IMG_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

export default function ProductCard({ product: p, priority = false }) {
  const off = discountPercent(p);
  const colors = p.options?.colors || [];
  const sizes = p.options?.sizes || [];
  const isNew = Date.now() - new Date(p.createdAt).getTime() < 14 * 864e5;
  const kicker = p.brand || genderLabel(p.gender);

  return (
    <article className="card">
      <Link href={productPath(p)} className="card-link" aria-label={p.title}>
        <div className={`card-media ${!p.inStock ? "is-soldout" : ""}`}>
          {p.images?.[0] ? (
            <>
              <Image src={p.images[0]} alt={p.title} fill priority={priority} sizes={IMG_SIZES} className="card-img" />
              {p.images[1] && <Image src={p.images[1]} alt="" fill sizes={IMG_SIZES} className="card-img card-img-alt" />}
            </>
          ) : (
            <div className="img-fallback" aria-hidden="true">
              {p.title?.[0] || "و"}
            </div>
          )}

          {!p.inStock ? (
            <span className="card-soldout">ناموجود</span>
          ) : (
            <>
              {off > 0 && (
                <span className="card-ribbon" aria-label={`${faNum(off)} درصد تخفیف`}>
                  <b>٪{faNum(off)}</b>
                  <small>تخفیف</small>
                </span>
              )}
              {off === 0 && isNew && <span className="card-new">جدید</span>}

              {sizes.length > 0 && (
                <div className="card-sizes" aria-hidden="true">
                  {sizes.slice(0, SIZES_SHOWN).map((s) => (
                    <span key={s.size} className={`sz ${s.inStock ? "" : "off"}`}>
                      {s.size}
                    </span>
                  ))}
                  {sizes.length > SIZES_SHOWN && <span className="sz more">+{faNum(sizes.length - SIZES_SHOWN)}</span>}
                </div>
              )}
            </>
          )}
        </div>

        <div className="card-body">
          {kicker && <span className="card-kicker">{kicker}</span>}
          <h3 className="card-title">{p.title}</h3>

          <div className="card-foot">
            <div className="card-price">
              <span className="price">
                {toman(p.finalPrice)} <small>تومان</small>
              </span>
              {p.hasDiscount && <del className="old-price">{toman(p.price)}</del>}
            </div>

            {colors.length > 0 && (
              <span className="swatches" aria-label={`${faNum(colors.length)} رنگ`}>
                {colors.slice(0, COLORS_SHOWN).map((c) => (
                  <i key={c.name} style={{ background: c.code || "#bbb" }} title={c.name} />
                ))}
                {colors.length > COLORS_SHOWN && <em>+{faNum(colors.length - COLORS_SHOWN)}</em>}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductSkeletons({ count = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="card-media skeleton" />
          <div className="card-body">
            <div className="skeleton sk-line" style={{ width: "30%" }} />
            <div className="skeleton sk-line" style={{ width: "85%" }} />
            <div className="skeleton sk-line" style={{ width: "50%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
