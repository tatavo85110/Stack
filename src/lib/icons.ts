/** Turns an image file (.ico, .png, .svg…) into a small PNG data URL, so it syncs with the rest of the data. */
export async function fileToIcon(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const r = Math.min(128 / img.width, 128 / img.height);
    const w = img.width * r, h = img.height * r;
    ctx.drawImage(img, (128 - w) / 2, (128 - h) / 2, w, h);
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Favicon of a website, fetched by the browser from Google's favicon service (only the domain is sent). */
export function siteFavicon(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return host.includes(".") ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128` : null;
  } catch {
    return null;
  }
}
