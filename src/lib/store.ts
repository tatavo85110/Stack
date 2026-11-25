"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { App, Client, Column, Project, Shortcut, TimeEntry, Timer, Todo } from "./types";
import { seedApps, seedClients, seedProjects, seedShortcuts, seedTime, seedTodos } from "./seed";

const uid = () => Math.random().toString(36).slice(2, 10);
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
});
const DATA_KEYS = ["shortcuts", "apps", "clients", "projects", "time", "todos", "timer", "lastImport", "widgets", "note"] as const;
export const DEFAULT_WIDGETS = ["kpis", "raccourcis", "semaine", "echeances", "applis", "taches", "ca", "projet", "pipeline", "rdv"];

export const useStack = create<State>()(
  persist(
    (set, get) => ({
      ...empty(),
      theme: "light",
      widgets: DEFAULT_WIDGETS,
      note: "",
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
      clearAll: () => set({ ...empty(), lastImport: null }),
      exportData: () => {
        const st = get() as unknown as Record<string, unknown>;
        return JSON.stringify({ app: "stack", version: 2, exportedAt: new Date().toISOString(), data: Object.fromEntries(DATA_KEYS.map((k) => [k, st[k]])) }, null, 2);
      },
      importData: (json) => {
        const parsed = JSON.parse(json);
        if (parsed?.app !== "stack" || typeof parsed.data !== "object") throw new Error("Ce fichier n'est pas une sauvegarde Stack.");
        const d = parsed.data as Record<string, unknown>;
        set(Object.fromEntries(DATA_KEYS.filter((k) => k in d).map((k) => [k, d[k]])) as Partial<State>);
      },
    }),
    { name: "stack-data-v2" },
  ),
);

/** Avoids hydration mismatches: renders persisted data only once mounted in the browser. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}
