"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconClose, IconZoom } from "./Icons";

export default function Gallery({ images = [], title }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touch = useRef(null);
  const total = images.length;

  const go = (n) => setIdx((i) => (total ? (i + n + total) % total : 0));

  useEffect(() => {
    if (!zoom) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, total]);

  if (!total) {
    return (
      <div className="gallery">
        <div className="gallery-main">
          <div className="img-fallback">{title?.[0] || "و"}</div>
        </div>
      </div>
    );
  }

  const onTouchStart = (e) => (touch.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
  };

  return (
    <div className="gallery">
      {total > 1 && (
        <div className="thumbs" role="tablist" aria-label="تصاویر محصول">
          {images.map((src, i) => (
            <button key={src} className={`thumb ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)} aria-label={`تصویر ${i + 1}`} role="tab" aria-selected={i === idx}>
              <Image src={src} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}

      <div className="gallery-main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Image key={images[idx]} src={images[idx]} alt={`${title} - تصویر ${idx + 1}`} fill priority sizes="(max-width: 900px) 100vw, 50vw" className="fade-in" />
        <button className="zoom-btn" onClick={() => setZoom(true)} aria-label="بزرگنمایی">
          <IconZoom size={20} />
        </button>
        {total > 1 && (
          <div className="dots-nav" aria-hidden="true">
            {images.map((_, i) => (
              <i key={i} className={i === idx ? "on" : ""} />
            ))}
          </div>
        )}
      </div>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(false)} role="dialog" aria-modal="true">
          <button className="icon-btn lightbox-close" onClick={() => setZoom(false)} aria-label="بستن">
            <IconClose />
          </button>
          <div className="lightbox-img" onClick={(e) => e.stopPropagation()}>
            <Image src={images[idx]} alt={title} fill sizes="100vw" style={{ objectFit: "contain" }} />
          </div>
          {total > 1 && (
            <>
              <button className="lb-nav lb-prev" onClick={(e) => (e.stopPropagation(), go(-1))} aria-label="قبلی">
                ›
              </button>
              <button className="lb-nav lb-next" onClick={(e) => (e.stopPropagation(), go(1))} aria-label="بعدی">
                ‹
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
