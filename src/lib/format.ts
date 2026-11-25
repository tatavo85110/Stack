export const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const num = (n: number, d = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(n);
export const daysUntil = (iso: string) => (iso ? Math.round((new Date(iso).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 86_400_000) : Infinity);
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
export const longDate = (d = new Date()) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
export const hours = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
export { isoIn } from "./seed";
export const INDY_URL = "https://app.indy.fr";
