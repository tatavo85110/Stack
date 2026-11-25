/** Packs data into a URL-safe string (compressed), so a page can be shared as a plain link. */
export async function pack(data: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  buf.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function unpack<T>(s: string): Promise<T> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return JSON.parse(await new Response(stream).text()) as T;
}

export const baseUrl = () => `${location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

export interface PortalData {
  v: 1;
  client: string;
  from: string;
  email: string;
  at: string;
  apps: { name: string; url: string; uptime: number; status: string }[];
  projects: { title: string; progress: number; column: string; due: string; tasks: { label: string; done: boolean }[]; deliverables: { label: string; url: string; date: string }[] }[];
  inbox?: { url: string; key: string };
}
export interface StatusData { v: 1; name: string; url: string; uptime: number; series: number[]; at: string }
