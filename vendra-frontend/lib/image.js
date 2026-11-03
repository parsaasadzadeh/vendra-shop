// فشرده‌سازی عکس قبل از آپلود: روی Vercel کل بدنه‌ی درخواست حدود ۴٫۵ مگابایت است
export const MAX_IMAGES = 10;
export const MAX_REQUEST_BYTES = 3 * 1024 * 1024; // سقف امن برای هر درخواست (با احتساب فیلدها)

const TARGET_BYTES = 800 * 1024;
const MAX_SIDE = 1600;

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fallback below */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
};

export async function compressImage(file) {
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
    throw new Error(`«${file.name}» عکس معتبر نیست (فقط jpg، png و webp)`);
  }

  let bmp;
  try {
    bmp = await loadBitmap(file);
  } catch {
    throw new Error(`«${file.name}» خوانده نشد`);
  }

  let scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  let quality = 0.86;
  let blob = null;
  let type = "image/webp";

  for (let attempt = 0; attempt < 8; attempt++) {
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bmp, 0, 0, w, h);

    blob = await toBlob(canvas, type, quality);
    // مرورگرهایی که webp نمی‌سازند، PNG برمی‌گردانند؛ برای آن‌ها JPEG (با پس‌زمینه‌ی سفید)
    if (!blob || blob.type !== type) {
      type = "image/jpeg";
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      blob = await toBlob(canvas, type, quality);
    }
    if (blob && blob.size <= TARGET_BYTES) break;
    if (quality > 0.6) quality -= 0.1;
    else scale *= 0.8;
  }

  if (bmp.close) bmp.close();
  if (!blob) throw new Error(`«${file.name}» فشرده نشد`);

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "_").slice(0, 40) || "image";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}

// عکس‌ها را طوری دسته‌بندی می‌کند که حجم هر درخواست زیر سقف بماند
export function batchFiles(files, maxBytes = MAX_REQUEST_BYTES) {
  const batches = [];
  let current = [];
  let size = 0;
  for (const f of files) {
    if (current.length && size + f.size > maxBytes) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(f);
    size += f.size;
  }
  if (current.length) batches.push(current);
  return batches;
}

export const prettySize = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`);
