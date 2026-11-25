import type { App, Client, TimeEntry } from "./types";
import { daysUntil } from "./format";
import { useStack } from "./store";

/** Revenue of one month: the Indy dashboard figure when synced, otherwise the imported invoices. */
function monthRevenue(clients: Client[], key: string) {
  const indy = useStack.getState().indyMonthly?.[key];
  if (typeof indy === "number") return indy;
  return clients.flatMap((c) => c.invoices).filter((i) => i.date.startsWith(key)).reduce((a, i) => a + i.amount, 0);
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function revenueByMonth(clients: Client[], months = 12) {
  const now = new Date();
  return Array.from({ length: months }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - k), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const value = monthRevenue(clients, key);
    return { label: MONTHS[d.getMonth()].replace(".", ""), value, key };
  });
}

export function revenueYear(clients: Client[]) {
  const y = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => monthRevenue(clients, `${y}-${String(i + 1).padStart(2, "0")}`)).reduce((a, v) => a + v, 0);
}

export function revenueThisMonth(clients: Client[]) {
  return revenueByMonth(clients, 1)[0].value;
}

export const clientTotal = (c: Client) => Math.max(c.invoices.reduce((a, i) => a + i.amount, 0), c.indyTotal ?? 0);

export function averageBasket(clients: Client[]) {
  const inv = clients.flatMap((c) => c.invoices).filter((i) => i.amount >= 500);
  return inv.length ? inv.reduce((a, i) => a + i.amount, 0) / inv.length : 0;
}

export function conversionRate(clients: Client[]) {
  const decided = clients.filter((c) => c.stage !== "Prospect" && c.stage !== "Devis envoyé");
  const won = decided.filter((c) => c.stage !== "Perdu");
  return decided.length ? (won.length / decided.length) * 100 : 0;
}

export function signatureDelay(clients: Client[]) {
  const d = clients.filter((c) => c.signedAt).map((c) => (new Date(c.signedAt!).getTime() - new Date(c.firstContact).getTime()) / 86_400_000);
  return d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0;
}

/** Average monthly revenue over the last 12 months. */
export const monthlyAverage = (clients: Client[]) => revenueByMonth(clients, 12).reduce((a, m) => a + m.value, 0) / 12;

export function sources(clients: Client[]) {
  const m = new Map<string, number>();
  for (const c of clients) m.set(c.source, (m.get(c.source) ?? 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

/** Share of paying clients who were billed more than once (repeat business). */
export function loyalty(clients: Client[]) {
  const paying = clients.filter((c) => c.invoices.length > 0);
  const repeat = paying.filter((c) => c.invoices.length > 1);
  return paying.length ? (repeat.length / paying.length) * 100 : 0;
}

/** Revenue of the last 30 days divided by billable hours of the last 30 days. */
export function realHourlyRate(clients: Client[], time: TimeEntry[]) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const rev = clients.flatMap((c) => c.invoices).filter((i) => i.date >= since).reduce((a, i) => a + i.amount, 0);
  const h = time.filter((t) => t.billable && t.date >= since).reduce((a, t) => a + t.minutes, 0) / 60;
  return h ? rev / h : 0;
}

export function deadlines(apps: App[], within = 60) {
  return apps
    .flatMap((a) => [
      { app: a, kind: "Domaine", date: a.domainExpiry },
      { app: a, kind: "Certificat SSL", date: a.sslExpiry },
      { app: a, kind: "Hébergement", date: a.hostingRenewal },
    ])
    .filter((d) => d.date && daysUntil(d.date) <= within)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function weekMinutes(time: TimeEntry[]) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  return days.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { label, iso, value: time.filter((t) => t.date === iso).reduce((a, t) => a + t.minutes, 0) };
  });
}
