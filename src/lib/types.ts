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
}

export interface Invoice { date: string; amount: number }
export interface HistoryItem { date: string; label: string }

export interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
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
}

export interface TimeEntry { id: string; projectId: string; label: string; date: string; minutes: number; billable: boolean }

export interface Contract {
  id: string;
  clientId: string;
  monthly: number;
  hoursIncluded: number;
  hoursUsed: number;
  renewal: string;
  interventions: { date: string; label: string; minutes: number }[];
}

export interface Todo { id: string; label: string; done: boolean }

export interface Timer { projectId: string; label: string; startedAt: number }
