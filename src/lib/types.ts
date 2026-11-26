export type AppStatus = "ok" | "warn" | "down";
export type Stage = "Prospect" | "Devis envoyé" | "Signé" | "Actif" | "Perdu";
export type Column = "todo" | "doing" | "review" | "done";

export interface Shortcut {
  id: string;
  name: string;
  url: string;
  group: string;
  icon?: string; // data URL of an imported favicon
  initials: string;
  color: string;
}

export interface Deploy { id: string; message: string; status: "Réussi" | "Échoué" | "Preview"; date: string; author: string }

export interface App {
  id: string;
  name: string;
  /** Favicon: an imported image (data URL) or the site's own favicon. */
  icon?: string;
  /** Category chosen by Mathéo (e.g. "Clients", "Perso", "SaaS"). Empty = no category. */
  category?: string;
  clientId?: string;
  url: string;
  stack: string;
  host: string;
  status: AppStatus;
  uptime: number; // % over 30 days
  responseMs: number;
  errors7d: number;
  domainExpiry: string; // ISO date
  sslExpiry: string;
  hostingRenewal: string;
  deploys: Deploy[];
  responseSeries: number[]; // 24 points
  uptimeSeries: number[]; // 30 points
  notes: string;
  /** Live checks done from the browser (most recent first, capped). */
  checks?: Check[];
  sentryOrg?: string;
  sentryProject?: string;
  sentryIssues?: SentryIssue[];
  sentryCheckedAt?: string;
  deployProvider?: "" | "vercel" | "netlify" | "coolify";
  deployProjectId?: string;
  lastBackup?: string;
  backupEveryDays?: number;
}

export interface Check { t: number; ok: boolean; ms: number }
export interface SentryIssue { id: string; title: string; culprit: string; count: number; lastSeen: string; level: string; permalink: string }

export interface Invoice { date: string; amount: number }
export interface HistoryItem { date: string; label: string }

export interface Client {
  id: string;
  name: string;
  /** Person to talk to at the client (e.g. the manager), when the client is a company. */
  contact: string;
  email: string;
  phone: string;
  email2?: string;
  phone2?: string;
  sector: string;
  stage: Stage;
  source: "Bouche-à-oreille" | "Site web" | "LinkedIn" | "Malt" | "Réseau";
  since: string;
  firstContact: string;
  signedAt?: string;
  invoices: Invoice[];
  quoteAmount?: number;
  nextAction?: { label: string; date: string };
  history: HistoryItem[];
  /** "Total facturé TTC" shown on Indy's client list, when the client comes from Indy. */
  indyTotal?: number;
}

export interface Project {
  id: string;
  title: string;
  clientId?: string;
  appId?: string;
  column: Column;
  due: string;
  progress: number;
  tag: string;
  tasks?: Todo[];
  deliverables?: Deliverable[];
}

export interface Deliverable { id: string; label: string; url: string; date: string }

export interface ClientRequest { id: string; clientId?: string; from: string; date: string; text: string; status: "Nouvelle" | "En cours" | "Faite" }

export type ContentKind = "projet" | "temoignage" | "article";
export interface ContentItem { id: string; kind: ContentKind; title: string; body: string; url: string; image: string; author: string; date: string; tags: string[]; published: boolean }

export interface ProjectTemplate { id: string; name: string; tag: string; days: number; tasks: string[] }

export interface TechNote { id: string; title: string; body: string; tags: string[]; appId?: string; date: string }

export interface Settings {
  myName: string;
  contactEmail: string;
  hourlyRate: number;
  monitorMinutes: number;
  notify: boolean;
  sentryToken: string;
  vercelToken: string;
  vercelTeamId: string;
  netlifyToken: string;
  coolifyUrl: string;
  coolifyToken: string;
  anthropicKey: string;
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
  githubPath: string;
  supabaseUrl: string;
  supabaseKey: string;
}

export interface TimeEntry { id: string; projectId: string; label: string; date: string; minutes: number; billable: boolean }

export interface Todo { id: string; label: string; done: boolean }

export interface Timer { projectId: string; label: string; startedAt: number }
