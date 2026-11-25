"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { App, Client, Column, Contract, Project, Shortcut, TimeEntry, Timer, Todo } from "./types";
import { seedApps, seedClients, seedContracts, seedProjects, seedShortcuts, seedTime, seedTodos } from "./seed";

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

interface State {
  shortcuts: Shortcut[];
  apps: App[];
  clients: Client[];
  projects: Project[];
  time: TimeEntry[];
  contracts: Contract[];
  todos: Todo[];
  timer: Timer | null;
  theme: "light" | "dark";
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
  addClient: (c: Pick<Client, "name" | "contact" | "email" | "phone" | "sector" | "source" | "stage">) => string;
  setClientStage: (id: string, stage: Client["stage"]) => void;
  completeNextAction: (id: string) => void;
  addApp: (a: Pick<App, "name" | "url" | "stack" | "host" | "clientId">) => void;
  importInvoices: (rows: { date: string; client: string; amount: number }[]) => { added: number; skipped: number; newClients: number };
  lastImport: string | null;
  toggleTheme: () => void;
  resetDemo: () => void;
}

const initial = () => ({
  shortcuts: seedShortcuts,
  apps: seedApps,
  clients: seedClients,
  projects: seedProjects,
  time: seedTime,
  contracts: seedContracts,
  todos: seedTodos,
  timer: null as Timer | null,
});

export const useStack = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      theme: "light",
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
        set({ clients: [...get().clients, { ...c, id, since: today(), firstContact: today(), invoices: [], history: [{ date: today(), label: "Client créé dans Stack" }] }] });
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
      addApp: (a) =>
        set({
          apps: [
            ...get().apps,
            { ...a, id: uid(), status: "ok", uptime: 100, responseMs: 0, errors7d: 0, domainExpiry: "", sslExpiry: "", hostingRenewal: "", deploys: [], responseSeries: Array(24).fill(0), uptimeSeries: Array(30).fill(100), notes: "" },
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
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      resetDemo: () => set({ ...initial() }),
    }),
    { name: "stack-data-v1" },
  ),
);

/** Avoids hydration mismatches: renders persisted data only once mounted in the browser. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}
