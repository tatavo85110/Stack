import type { App, Client, Contract, Project, Shortcut, TimeEntry, Todo } from "./types";

const day = 86_400_000;
export const isoIn = (days: number) => new Date(Date.now() + days * day).toISOString().slice(0, 10);
const monthAgo = (m: number, d = 12) => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth() - m, d).toISOString().slice(0, 10);
};
const series = (n: number, base: number, spread: number, seed: number) =>
  Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i * 0.9 + seed) * spread * 0.6 + Math.cos(i * 2.3 + seed) * spread * 0.4));

export const seedShortcuts: Shortcut[] = [
  { id: "s1", name: "Indy", url: "https://app.indy.fr", group: "Admin et compta", initials: "IN", color: "#1d5fd8" },
  { id: "s2", name: "Banque", url: "https://www.qonto.com", group: "Admin et compta", initials: "BQ", color: "#0b1f3a" },
  { id: "s3", name: "URSSAF", url: "https://www.autoentrepreneur.urssaf.fr", group: "Admin et compta", initials: "UR", color: "#2f7fd0" },
  { id: "s4", name: "GitHub", url: "https://github.com", group: "Dev", initials: "GH", color: "#15325a" },
  { id: "s5", name: "Vercel", url: "https://vercel.com/dashboard", group: "Dev", initials: "▲", color: "#0b1f3a" },
  { id: "s6", name: "OVH", url: "https://www.ovh.com/manager", group: "Dev", initials: "OV", color: "#1d5fd8" },
  { id: "s7", name: "Sentry", url: "https://sentry.io", group: "Dev", initials: "SC", color: "#2f7fd0" },
  { id: "s8", name: "Gmail", url: "https://mail.google.com", group: "Communication", initials: "GM", color: "#1d5fd8" },
  { id: "s9", name: "Figma", url: "https://www.figma.com", group: "Communication", initials: "FG", color: "#15325a" },
  { id: "s10", name: "Notion", url: "https://www.notion.so", group: "Communication", initials: "N", color: "#0b1f3a" },
];

export const seedClients: Client[] = [
  {
    id: "c1", name: "Cabinet Morel", contact: "Claire Morel", email: "contact@cabinet-morel.fr", phone: "06 12 34 56 78",
    sector: "Santé", stage: "Actif", source: "Bouche-à-oreille", since: monthAgo(20), firstContact: monthAgo(21), signedAt: monthAgo(20, 28),
    invoices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => ({ date: monthAgo(m), amount: m === 4 ? 3200 : 180 })),
    nextAction: { label: "Démo du module rappel SMS", date: isoIn(2) },
    history: [
      { date: monthAgo(0, 3), label: "Appel : validation des maquettes SMS" },
      { date: monthAgo(1, 18), label: "Devis module SMS accepté (1 450 €)" },
      { date: monthAgo(4), label: "Mise en ligne de la landing" },
    ],
  },
  {
    id: "c2", name: "Resto Dupont", contact: "Marc Dupont", email: "marc@restodupont.fr", phone: "06 22 45 67 89",
    sector: "Restauration", stage: "Actif", source: "Site web", since: monthAgo(14), firstContact: monthAgo(15), signedAt: monthAgo(14, 20),
    invoices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => ({ date: monthAgo(m, 5), amount: m === 7 ? 2400 : 120 })),
    nextAction: { label: "Renouveler le domaine restodupont.fr", date: isoIn(6) },
    history: [{ date: monthAgo(0, 8), label: "Ajout du menu de Noël" }, { date: monthAgo(2), label: "Correctif horaires du dimanche" }],
  },
  {
    id: "c3", name: "Garage Leroy", contact: "Paul Leroy", email: "garage.leroy@gmail.com", phone: "07 11 22 33 44",
    sector: "Automobile", stage: "Actif", source: "Réseau", since: monthAgo(8), firstContact: monthAgo(9), signedAt: monthAgo(8, 15),
    invoices: [0, 1, 2, 3, 4, 5, 6, 7].map((m) => ({ date: monthAgo(m, 20), amount: m === 6 ? 3800 : 150 })),
    nextAction: { label: "Point sur l'outil de stock", date: isoIn(5) },
    history: [{ date: monthAgo(1, 10), label: "Formation à l'outil de stock" }],
  },
  {
    id: "c4", name: "Boulangerie Petit", contact: "Julie Petit", email: "bonjour@boulangerie-petit.fr", phone: "06 98 76 54 32",
    sector: "Commerce", stage: "Devis envoyé", source: "LinkedIn", since: monthAgo(3), firstContact: monthAgo(1, 2), quoteAmount: 1900,
    invoices: [{ date: monthAgo(3), amount: 950 }],
    nextAction: { label: "Relancer le devis click & collect", date: isoIn(1) },
    history: [{ date: monthAgo(0, 2), label: "Devis click & collect envoyé" }],
  },
  {
    id: "c5", name: "Studio Nord", contact: "Inès Nord", email: "ines@studionord.fr", phone: "06 55 44 33 22",
    sector: "Création", stage: "Signé", source: "Malt", since: monthAgo(1), firstContact: monthAgo(2), signedAt: monthAgo(1, 25),
    invoices: [{ date: monthAgo(0, 2), amount: 1600 }], quoteAmount: 3200,
    nextAction: { label: "Envoyer l'arborescence du site", date: isoIn(3) },
    history: [{ date: monthAgo(1, 25), label: "Devis signé, acompte reçu" }],
  },
  {
    id: "c6", name: "Fleurs d'Anaïs", contact: "Anaïs Roux", email: "anais@fleursdanais.fr", phone: "06 10 20 30 40",
    sector: "Commerce", stage: "Prospect", source: "Bouche-à-oreille", since: monthAgo(0, 1), firstContact: monthAgo(0, 1),
    invoices: [], nextAction: { label: "Premier appel découverte", date: isoIn(4) }, history: [],
  },
];

const deploys = (seed: number) => [
  { id: `d${seed}1`, message: "feat: formulaire de réservation", status: "Réussi" as const, date: isoIn(-1), author: "Mathéo" },
  { id: `d${seed}2`, message: "fix: horaires du dimanche", status: "Réussi" as const, date: isoIn(-4), author: "Mathéo" },
  { id: `d${seed}3`, message: "chore: mise à jour Next 15", status: "Échoué" as const, date: isoIn(-6), author: "Mathéo" },
  { id: `d${seed}4`, message: "feat: page menu de Noël", status: "Preview" as const, date: isoIn(-9), author: "Mathéo" },
];

export const seedApps: App[] = [
  { id: "a1", name: "Appli RDV", clientId: "c1", url: "https://rdv.cabinet-morel.fr", stack: "Next.js 15", host: "OVH", status: "down", uptime: 98.1, responseMs: 0, errors7d: 14, domainExpiry: isoIn(140), sslExpiry: isoIn(40), hostingRenewal: isoIn(200), deploys: deploys(1), responseSeries: series(24, 320, 120, 1), uptimeSeries: series(30, 99, 2, 1).map((v, i) => (i === 29 ? 0 : Math.min(100, v))), notes: "Serveur VPS OVH, base Postgres. Accès SSH dans le gestionnaire de mots de passe." },
  { id: "a2", name: "Resto Dupont", clientId: "c2", url: "https://restodupont.fr", stack: "Next.js 15", host: "Vercel", status: "warn", uptime: 99.98, responseMs: 182, errors7d: 2, domainExpiry: isoIn(6), sslExpiry: isoIn(81), hostingRenewal: isoIn(300), deploys: deploys(2), responseSeries: series(24, 180, 60, 2), uptimeSeries: Array(30).fill(100), notes: "Domaine chez OVH, à renouveler avant la fin du mois." },
  { id: "a3", name: "Landing Morel", clientId: "c1", url: "https://cabinet-morel.fr", stack: "Astro", host: "Vercel", status: "ok", uptime: 100, responseMs: 95, errors7d: 0, domainExpiry: isoIn(220), sslExpiry: isoIn(70), hostingRenewal: isoIn(260), deploys: deploys(3), responseSeries: series(24, 95, 30, 3), uptimeSeries: Array(30).fill(100), notes: "" },
  { id: "a4", name: "Outil stock", clientId: "c3", url: "https://stock.garage-leroy.fr", stack: "Next.js 14", host: "Railway", status: "ok", uptime: 99.9, responseMs: 240, errors7d: 1, domainExpiry: isoIn(190), sslExpiry: isoIn(60), hostingRenewal: isoIn(25), deploys: deploys(4), responseSeries: series(24, 240, 80, 4), uptimeSeries: series(30, 100, 1, 4).map((v) => Math.min(100, v)), notes: "" },
  { id: "a5", name: "Boulangerie Petit", clientId: "c4", url: "https://boulangerie-petit.fr", stack: "WordPress", host: "o2switch", status: "ok", uptime: 99.7, responseMs: 410, errors7d: 0, domainExpiry: isoIn(95), sslExpiry: isoIn(50), hostingRenewal: isoIn(95), deploys: deploys(5), responseSeries: series(24, 410, 90, 5), uptimeSeries: Array(30).fill(100), notes: "" },
  { id: "a6", name: "Studio Nord", clientId: "c5", url: "https://studionord.fr", stack: "Next.js 15", host: "Vercel", status: "ok", uptime: 100, responseMs: 120, errors7d: 0, domainExpiry: isoIn(330), sslExpiry: isoIn(85), hostingRenewal: isoIn(330), deploys: deploys(6), responseSeries: series(24, 120, 40, 6), uptimeSeries: Array(30).fill(100), notes: "Site en cours de refonte." },
  { id: "a7", name: "Portfolio", url: "https://matheo.dev", stack: "Astro", host: "Vercel", status: "ok", uptime: 100, responseMs: 80, errors7d: 0, domainExpiry: isoIn(250), sslExpiry: isoIn(75), hostingRenewal: isoIn(250), deploys: deploys(7), responseSeries: series(24, 80, 20, 7), uptimeSeries: Array(30).fill(100), notes: "" },
  { id: "a8", name: "Stack", url: "http://localhost:3000", stack: "Next.js 15", host: "Vercel", status: "ok", uptime: 100, responseMs: 110, errors7d: 0, domainExpiry: isoIn(365), sslExpiry: isoIn(90), hostingRenewal: isoIn(365), deploys: deploys(8), responseSeries: series(24, 110, 30, 8), uptimeSeries: Array(30).fill(100), notes: "Ce cockpit." },
];

export const seedProjects: Project[] = [
  { id: "p1", title: "Menu de Noël en ligne", clientId: "c2", appId: "a2", column: "todo", due: isoIn(10), progress: 0, tag: "Front" },
  { id: "p2", title: "Click & collect", clientId: "c4", appId: "a5", column: "todo", due: isoIn(30), progress: 0, tag: "Devis" },
  { id: "p3", title: "Arborescence du site", clientId: "c5", appId: "a6", column: "todo", due: isoIn(3), progress: 10, tag: "UX" },
  { id: "p4", title: "Module rappel SMS", clientId: "c1", appId: "a1", column: "doing", due: isoIn(8), progress: 65, tag: "Back" },
  { id: "p5", title: "Export inventaire PDF", clientId: "c3", appId: "a4", column: "doing", due: isoIn(12), progress: 40, tag: "Back" },
  { id: "p6", title: "Optimisation des images", clientId: "c2", appId: "a2", column: "review", due: isoIn(2), progress: 90, tag: "Perf" },
  { id: "p7", title: "Vitrine boulangerie", clientId: "c4", appId: "a5", column: "done", due: isoIn(-20), progress: 100, tag: "Front" },
  { id: "p8", title: "Refonte du portfolio", appId: "a7", column: "done", due: isoIn(-12), progress: 100, tag: "Perso" },
];

export const seedTime: TimeEntry[] = [
  { id: "t1", projectId: "p4", label: "API d'envoi SMS", date: isoIn(0), minutes: 135, billable: true },
  { id: "t2", projectId: "p5", label: "Corriger le bug d'export", date: isoIn(0), minutes: 50, billable: true },
  { id: "t3", projectId: "p6", label: "Compression WebP", date: isoIn(-1), minutes: 90, billable: true },
  { id: "t4", projectId: "p4", label: "Maquettes écran rappel", date: isoIn(-1), minutes: 120, billable: true },
  { id: "t5", projectId: "p8", label: "Articles du blog", date: isoIn(-2), minutes: 75, billable: false },
  { id: "t6", projectId: "p3", label: "Atelier avec Inès", date: isoIn(-2), minutes: 60, billable: true },
  { id: "t7", projectId: "p5", label: "Modèle PDF", date: isoIn(-3), minutes: 110, billable: true },
  { id: "t8", projectId: "p6", label: "Lazy loading", date: isoIn(-3), minutes: 45, billable: true },
];

export const seedContracts: Contract[] = [
  { id: "m1", clientId: "c1", monthly: 180, hoursIncluded: 4, hoursUsed: 2.5, renewal: isoIn(95), interventions: [{ date: isoIn(-3), label: "Mise à jour sécurité", minutes: 60 }, { date: isoIn(-12), label: "Ajout d'un praticien", minutes: 90 }] },
  { id: "m2", clientId: "c2", monthly: 120, hoursIncluded: 3, hoursUsed: 2.75, renewal: isoIn(140), interventions: [{ date: isoIn(-1), label: "Changement des horaires", minutes: 45 }, { date: isoIn(-8), label: "Photos de la carte", minutes: 120 }] },
  { id: "m3", clientId: "c3", monthly: 150, hoursIncluded: 3, hoursUsed: 1, renewal: isoIn(20), interventions: [{ date: isoIn(-6), label: "Nouvel utilisateur", minutes: 60 }] },
  { id: "m4", clientId: "c4", monthly: 60, hoursIncluded: 1, hoursUsed: 0.25, renewal: isoIn(200), interventions: [{ date: isoIn(-15), label: "Mise à jour WordPress", minutes: 15 }] },
];

export const seedTodos: Todo[] = [
  { id: "td1", label: "Relancer le devis Petit", done: false },
  { id: "td2", label: "Corriger le bug d'export", done: true },
  { id: "td3", label: "Renouveler restodupont.fr", done: false },
  { id: "td4", label: "Préparer la démo SMS", done: false },
];
