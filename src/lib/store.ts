"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { App, Check, Client, ClientRequest, Column, ContentItem, Project, ProjectTemplate, Settings, Shortcut, TechNote, TimeEntry, Timer, Todo } from "./types";
import { seedApps, seedClients, seedProjects, seedShortcuts, seedTime, seedTodos } from "./seed";

export const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

interface State {
  shortcuts: Shortcut[];
  apps: App[];
  clients: Client[];
  projects: Project[];
  time: TimeEntry[];
  todos: Todo[];
  timer: Timer | null;
  theme: "light" | "dark";
  widgets: string[];
  note: string;
  settings: Settings;
  requests: ClientRequest[];
  content: ContentItem[];
  templates: ProjectTemplate[];
  techNotes: TechNote[];
  morning: { date: string; text: string } | null;
  setSettings: (s: Partial<Settings>) => void;
  recordCheck: (appId: string, c: Check) => void;
  addRequest: (r: Omit<ClientRequest, "id">) => void;
  updateRequest: (id: string, r: Partial<ClientRequest>) => void;
  removeRequest: (id: string) => void;
  saveContent: (c: Omit<ContentItem, "id"> & { id?: string }) => void;
  removeContent: (id: string) => void;
  saveTemplate: (t: Omit<ProjectTemplate, "id"> & { id?: string }) => void;
  removeTemplate: (id: string) => void;
  saveNote: (n: Omit<TechNote, "id" | "date"> & { id?: string }) => void;
  removeNote: (id: string) => void;
  setMorning: (text: string) => void;
  addTodos: (labels: string[]) => void;
  replaceAll: (data: Record<string, unknown>) => void;
  setWidgets: (w: string[]) => void;
  setNote: (n: string) => void;
  addShortcut: (s: Omit<Shortcut, "id">) => void;
  updateShortcut: (id: string, s: Partial<Shortcut>) => void;
  removeShortcut: (id: string) => void;
  toggleTodo: (id: string) => void;
  addTodo: (label: string) => void;
  removeTodo: (id: string) => void;
  moveProject: (id: string, column: Column) => void;
  addProject: (p: Omit<Project, "id">) => void;
  startTimer: (projectId: string, label: string) => void;
  stopTimer: () => void;
  addTimeEntry: (e: Omit<TimeEntry, "id">) => void;
  addClient: (c: Pick<Client, "name" | "contact" | "email" | "phone" | "sector" | "source" | "stage" | "quoteAmount">) => string;
  setClientStage: (id: string, stage: Client["stage"]) => void;
  completeNextAction: (id: string) => void;
  addHistory: (id: string, label: string) => void;
  addApp: (a: Pick<App, "name" | "url" | "stack" | "host" | "clientId"> & Partial<Pick<App, "domainExpiry" | "sslExpiry" | "hostingRenewal" | "notes" | "status">>) => void;
  importInvoices: (rows: { date: string; client: string; amount: number }[]) => { added: number; skipped: number; newClients: number };
  lastImport: string | null;
  /** Monthly revenue read from the Indy "Pilotage" dashboard, keyed "YYYY-MM". Wins over imported invoices. */
  indyMonthly: Record<string, number>;
  indySyncedAt: string | null;
  setIndyMonthly: (byYear: Record<string, number[]>) => number;
  updateApp: (id: string, a: Partial<App>) => void;
  removeApp: (id: string) => void;
  updateClient: (id: string, c: Partial<Client>) => void;
  removeClient: (id: string) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  removeProject: (id: string) => void;
  removeTimeEntry: (id: string) => void;
  toggleTheme: () => void;
  loadDemo: () => void;
  clearAll: () => void;
  exportData: () => string;
  importData: (json: string) => void;
}

const demo = () => ({
  shortcuts: seedShortcuts,
  apps: seedApps,
  clients: seedClients,
  projects: seedProjects,
  time: seedTime,
  todos: seedTodos,
  timer: null as Timer | null,
});
const empty = () => ({
  shortcuts: [] as Shortcut[],
  apps: [] as App[],
  clients: [] as Client[],
  projects: [] as Project[],
  time: [] as TimeEntry[],
  todos: [] as Todo[],
  timer: null as Timer | null,
  requests: [] as ClientRequest[],
  content: [] as ContentItem[],
  techNotes: [] as TechNote[],
});
export const DATA_KEYS = ["shortcuts", "apps", "clients", "projects", "time", "todos", "timer", "lastImport", "indyMonthly", "indySyncedAt", "widgets", "note", "settings", "requests", "content", "templates", "techNotes"] as const;
/** Keys and tokens: they stay on this device and are never put in backups or in the sync. */
export const SECRET_SETTINGS = ["sentryToken", "vercelToken", "netlifyToken", "coolifyToken", "anthropicKey", "githubToken"] as const;

export const DEFAULT_SETTINGS: Settings = {
  myName: "", contactEmail: "", hourlyRate: 55, monitorMinutes: 5, notify: false,
  sentryToken: "", vercelToken: "", vercelTeamId: "", netlifyToken: "", coolifyUrl: "", coolifyToken: "",
  anthropicKey: "", githubToken: "", githubRepo: "", githubBranch: "main", githubPath: "content/stack.json",
  supabaseUrl: "https://lljdjaribokedlowakud.supabase.co", supabaseKey: "sb_publishable_E7OOIK6lFTDlytbSQpOfyg_l62zdyR1",
};
const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  { id: "tpl-site", name: "Site vitrine", tag: "Site", days: 21, tasks: ["Brief et arborescence", "Maquettes", "Intégration", "Contenus du client", "SEO de base", "Mise en ligne", "Formation du client"] },
  { id: "tpl-app", name: "Application web", tag: "Appli", days: 45, tasks: ["Cadrage et devis signé", "Modèle de données", "Maquettes", "Développement", "Tests", "Mise en production", "Suivi Sentry"] },
  { id: "tpl-maint", name: "Intervention maintenance", tag: "Maintenance", days: 3, tasks: ["Sauvegarde avant intervention", "Mises à jour", "Vérification du site", "Compte rendu au client"] },
];

/** Recomputes status, uptime and series of an app from its live checks. */
function withCheck(a: App, c: Check): App {
  const checks = [c, ...(a.checks ?? [])].slice(0, 3000);
  const day = 86_400_000, now = c.t;
  const last30 = checks.filter((x) => now - x.t < 30 * day);
  const uptime = last30.length ? (last30.filter((x) => x.ok).length / last30.length) * 100 : -1;
  const uptimeSeries = Array.from({ length: 30 }, (_, i) => {
    const from = now - (30 - i) * day, to = from + day;
    const d = checks.filter((x) => x.t > from && x.t <= to);
    return d.length ? (d.filter((x) => x.ok).length / d.length) * 100 : -1;
  });
  const responseSeries = Array.from({ length: 24 }, (_, i) => {
    const from = now - (24 - i) * 3_600_000, to = from + 3_600_000;
    const d = checks.filter((x) => x.ok && x.t > from && x.t <= to);
    return d.length ? Math.round(d.reduce((s, x) => s + x.ms, 0) / d.length) : 0;
  });
  const recent = checks.slice(0, 2);
  const status: App["status"] = !c.ok ? (recent.every((x) => !x.ok) ? "down" : "warn") : c.ms > 3000 ? "warn" : "ok";
  return { ...a, checks, uptime, uptimeSeries, responseSeries, responseMs: c.ok ? c.ms : a.responseMs, status };
}
export const DEFAULT_WIDGETS = ["kpis", "resume", "raccourcis", "semaine", "echeances", "applis", "taches", "ca", "projet", "pipeline", "rdv", "demandes"];

export const useStack = create<State>()(
  persist(
    (set, get) => ({
      ...empty(),
      theme: "light",
      widgets: DEFAULT_WIDGETS,
      note: "",
      settings: DEFAULT_SETTINGS,
      templates: DEFAULT_TEMPLATES,
      morning: null,
      setSettings: (x) => set({ settings: { ...get().settings, ...x } }),
      recordCheck: (appId, c) => set({ apps: get().apps.map((a) => (a.id === appId ? withCheck(a, c) : a)) }),
      addRequest: (r) => set({ requests: [{ ...r, id: uid() }, ...get().requests] }),
      updateRequest: (id, r) => set({ requests: get().requests.map((x) => (x.id === id ? { ...x, ...r } : x)) }),
      removeRequest: (id) => set({ requests: get().requests.filter((x) => x.id !== id) }),
      saveContent: (c) => set({ content: c.id && get().content.some((x) => x.id === c.id) ? get().content.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id } : x)) : [{ ...c, id: uid() }, ...get().content] }),
      removeContent: (id) => set({ content: get().content.filter((x) => x.id !== id) }),
      saveTemplate: (t) => set({ templates: t.id && get().templates.some((x) => x.id === t.id) ? get().templates.map((x) => (x.id === t.id ? { ...x, ...t, id: x.id } : x)) : [...get().templates, { ...t, id: uid() }] }),
      removeTemplate: (id) => set({ templates: get().templates.filter((x) => x.id !== id) }),
      saveNote: (n) => set({ techNotes: n.id && get().techNotes.some((x) => x.id === n.id) ? get().techNotes.map((x) => (x.id === n.id ? { ...x, ...n, id: x.id, date: today() } : x)) : [{ ...n, id: uid(), date: today() }, ...get().techNotes] }),
      removeNote: (id) => set({ techNotes: get().techNotes.filter((x) => x.id !== id) }),
      setMorning: (text) => set({ morning: { date: today(), text } }),
      addTodos: (labels) => set({ todos: [...get().todos, ...labels.map((label) => ({ id: uid(), label, done: false }))] }),
      replaceAll: (d) => set(Object.fromEntries(DATA_KEYS.filter((k) => k in d).map((k) => [k, k === "settings" ? { ...get().settings, ...(d[k] as object), ...secretsOf(get().settings) } : d[k]])) as Partial<State>),
      setWidgets: (widgets) => set({ widgets }),
      setNote: (note) => set({ note }),
      addShortcut: (s) => set({ shortcuts: [...get().shortcuts, { ...s, id: uid() }] }),
      updateShortcut: (id, s) => set({ shortcuts: get().shortcuts.map((x) => (x.id === id ? { ...x, ...s } : x)) }),
      removeShortcut: (id) => set({ shortcuts: get().shortcuts.filter((x) => x.id !== id) }),
      toggleTodo: (id) => set({ todos: get().todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }),
      addTodo: (label) => set({ todos: [...get().todos, { id: uid(), label, done: false }] }),
      removeTodo: (id) => set({ todos: get().todos.filter((t) => t.id !== id) }),
      moveProject: (id, column) =>
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, column, progress: column === "done" ? 100 : p.progress } : p)) }),
      addProject: (p) => set({ projects: [...get().projects, { ...p, id: uid() }] }),
      startTimer: (projectId, label) => {
        if (get().timer) get().stopTimer();
        set({ timer: { projectId, label, startedAt: Date.now() } });
      },
      stopTimer: () => {
        const t = get().timer;
        if (!t) return;
        const minutes = Math.max(1, Math.round((Date.now() - t.startedAt) / 60000));
        set({ timer: null, time: [{ id: uid(), projectId: t.projectId, label: t.label, date: today(), minutes, billable: true }, ...get().time] });
      },
      addTimeEntry: (e) => set({ time: [{ ...e, id: uid() }, ...get().time] }),
      addClient: (c) => {
        const id = uid();
        set({ clients: [...get().clients, { ...c, id, since: today(), firstContact: today(), signedAt: c.stage === "Signé" || c.stage === "Actif" ? today() : undefined, invoices: [], history: [{ date: today(), label: "Client créé dans Stack" }] }] });
        return id;
      },
      setClientStage: (id, stage) =>
        set({
          clients: get().clients.map((c) =>
            c.id === id ? { ...c, stage, signedAt: stage === "Signé" && !c.signedAt ? today() : c.signedAt, history: [{ date: today(), label: `Étape : ${stage}` }, ...c.history] } : c,
          ),
        }),
      completeNextAction: (id) =>
        set({
          clients: get().clients.map((c) =>
            c.id === id && c.nextAction ? { ...c, history: [{ date: today(), label: `Fait : ${c.nextAction.label}` }, ...c.history], nextAction: undefined } : c,
          ),
        }),
      addHistory: (id, label) => set({ clients: get().clients.map((c) => (c.id === id ? { ...c, history: [{ date: today(), label }, ...c.history] } : c)) }),
      addApp: (a) =>
        set({
          apps: [
            ...get().apps,
            { status: "ok", domainExpiry: "", sslExpiry: "", hostingRenewal: "", notes: "", ...a, id: uid(), uptime: -1, responseMs: 0, errors7d: 0, deploys: [], responseSeries: [], uptimeSeries: [] },
          ],
        }),
      lastImport: null,
      indyMonthly: {},
      indySyncedAt: null,
      setIndyMonthly: (byYear) => {
        const next = { ...get().indyMonthly };
        let n = 0;
        for (const [y, values] of Object.entries(byYear)) values.slice(0, 12).forEach((v, i) => { next[`${y}-${String(i + 1).padStart(2, "0")}`] = v; n++; });
        set({ indyMonthly: next, indySyncedAt: new Date().toISOString() });
        return n;
      },
      importInvoices: (rows) => {
        const clients = get().clients.map((c) => ({ ...c, invoices: [...c.invoices] }));
        let added = 0, skipped = 0, newClients = 0;
        const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        for (const r of rows) {
          let c = clients.find((x) => norm(x.name) === norm(r.client));
          if (!c) {
            c = { id: uid(), name: r.client, contact: "", email: "", phone: "", sector: "", stage: "Actif", source: "Réseau", since: r.date, firstContact: r.date, signedAt: r.date, invoices: [], history: [{ date: today(), label: "Client créé par l'import Indy" }] };
            clients.push(c);
            newClients++;
          }
          if (c.invoices.some((i) => i.date === r.date && Math.abs(i.amount - r.amount) < 0.01)) skipped++;
          else { c.invoices.push({ date: r.date, amount: r.amount }); added++; }
        }
        set({ clients, lastImport: new Date().toISOString() });
        return { added, skipped, newClients };
      },
      updateApp: (id, a) => set({ apps: get().apps.map((x) => (x.id === id ? { ...x, ...a } : x)) }),
      removeApp: (id) => set({ apps: get().apps.filter((x) => x.id !== id) }),
      updateClient: (id, c) => set({ clients: get().clients.map((x) => (x.id === id ? { ...x, ...c } : x)) }),
      removeClient: (id) =>
        set({
          clients: get().clients.filter((x) => x.id !== id),
          apps: get().apps.map((a) => (a.clientId === id ? { ...a, clientId: undefined } : a)),
          projects: get().projects.map((p) => (p.clientId === id ? { ...p, clientId: undefined } : p)),
        }),
      updateProject: (id, p) => set({ projects: get().projects.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
      removeProject: (id) => set({ projects: get().projects.filter((x) => x.id !== id), time: get().time.filter((t) => t.projectId !== id) }),
      removeTimeEntry: (id) => set({ time: get().time.filter((t) => t.id !== id) }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      loadDemo: () => set({ ...demo() }),
      clearAll: () => set({ ...empty(), lastImport: null, indyMonthly: {}, indySyncedAt: null }),
      exportData: () => JSON.stringify({ app: "stack", version: 3, exportedAt: new Date().toISOString(), data: publicData(get()) }, null, 2),
      importData: (json) => {
        const parsed = JSON.parse(json);
        if (parsed?.app !== "stack" || typeof parsed.data !== "object") throw new Error("Ce fichier n'est pas une sauvegarde Stack.");
        get().replaceAll(parsed.data as Record<string, unknown>);
      },
    }),
    {
      name: "stack-data-v2",
      version: 3,
      migrate: (p) => p as State,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...Object.fromEntries(Object.entries(p.settings ?? {}).filter(([, v]) => v !== "")) } as Settings, templates: p.templates ?? current.templates };
      },
    },
  ),
);

function secretsOf(s: Settings) {
  return Object.fromEntries(SECRET_SETTINGS.map((k) => [k, s[k]]));
}
/** Everything that can leave the device (backup file, sync): no keys or tokens. */
export function publicData(st: State) {
  const r = st as unknown as Record<string, unknown>;
  const d: Record<string, unknown> = Object.fromEntries(DATA_KEYS.map((k) => [k, r[k]]));
  d.settings = Object.fromEntries(Object.entries(st.settings).filter(([k]) => !(SECRET_SETTINGS as readonly string[]).includes(k)));
  return d;
}

/** Avoids hydration mismatches: renders persisted data only once mounted in the browser. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}
