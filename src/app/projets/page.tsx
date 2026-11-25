"use client";
import { useState } from "react";
import clsx from "clsx";
import { Plus, Play, CalendarDays } from "lucide-react";
import { useStack } from "@/lib/store";
import type { Column, Project } from "@/lib/types";
import { Button, Field, Kpi, Modal, PageHeader, Pill, Progress, inputCls } from "@/components/ui";
import { ProjectsTabs } from "@/components/ProjectsTabs";
import { daysUntil, hours, isoIn, shortDate } from "@/lib/format";
import { weekMinutes } from "@/lib/stats";

const COLS: { id: Column; label: string }[] = [
  { id: "todo", label: "À faire" },
  { id: "doing", label: "En cours" },
  { id: "review", label: "En revue" },
  { id: "done", label: "Terminé" },
];

function ProjectForm({ column, initial, onDone }: { column: Column; initial?: Project; onDone: () => void }) {
  const { clients, addProject, updateProject, removeProject } = useStack();
  const [f, setF] = useState({ title: initial?.title ?? "", clientId: initial?.clientId ?? "", due: initial?.due ?? isoIn(14), tag: initial?.tag ?? "Front", progress: initial?.progress ?? 0 });
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (!f.title.trim()) return;
      const data = { ...f, title: f.title.trim(), clientId: f.clientId || undefined };
      if (initial) updateProject(initial.id, data); else addProject({ ...data, column });
      onDone();
    }}>
      <Field label="Titre"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Client">
          <select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">Perso</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Échéance"><input type="date" className={inputCls} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
      </div>
      <Field label="Étiquette"><input className={inputCls} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} /></Field>
      <Field label={`Avancement : ${f.progress} %`}><input type="range" min="0" max="100" step="5" value={f.progress} onChange={(e) => setF({ ...f, progress: Number(e.target.value) })} className="w-full accent-[var(--bright)]" /></Field>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm(`Supprimer « ${initial.title} » et son temps ?`)) { removeProject(initial.id); onDone(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">{initial ? "Enregistrer" : "Ajouter"}</Button>
      </div>
    </form>
  );
}

export default function Projets() {
  const { projects, clients, time, timer, moveProject, startTimer } = useStack();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Column | null>(null);
  const [adding, setAdding] = useState<Column | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const week = weekMinutes(time).reduce((a, d) => a + d.value, 0);
  const billable = time.filter((t) => t.billable && weekMinutes(time).some((d) => d.iso === t.date)).reduce((a, t) => a + t.minutes, 0);
  const current = projects.find((p) => p.column === "doing");

  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Projets" }]} title="Projets" actions={<><ProjectsTabs value="kanban" /><Button variant="primary" onClick={() => setAdding("todo")}><Plus size={16} /> Nouveau projet</Button></>} />
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_200px_200px]">
        {current && (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-night p-5 text-white">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sky">Projet en cours</p>
              <p className="truncate text-lg font-extrabold">{current.title}</p>
              <div className="mt-2 h-2 max-w-sm rounded-full bg-white/15"><div className="h-full rounded-full bg-sky" style={{ width: `${current.progress}%` }} /></div>
            </div>
            <Button variant="accent" onClick={() => startTimer(current.id, current.title)} disabled={timer?.projectId === current.id}><Play size={14} fill="currentColor" /> {timer?.projectId === current.id ? "Chrono lancé" : "Lancer le chrono"}</Button>
          </div>
        )}
        <Kpi label="Heures cette semaine" value={hours(week)} />
        <Kpi tone="ice" label="Facturables" value={hours(billable)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLS.map((col) => {
          const items = projects.filter((p) => p.column === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
              onDragLeave={() => setOver(null)}
              onDrop={() => { if (drag) moveProject(drag, col.id); setDrag(null); setOver(null); }}
              className={clsx("rounded-2xl bg-muted p-3 transition-[box-shadow,background]", over === col.id && "bg-azure ring-2 ring-bright")}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm font-bold">{col.label} <span className="ml-1 text-ink-2">{items.length}</span></p>
                <button onClick={() => setAdding(col.id)} className="rounded-lg p-1 text-ink-2 transition-colors hover:bg-surface hover:text-bright" aria-label={`Ajouter dans ${col.label}`}><Plus size={16} /></button>
              </div>
              <div className="min-h-24 space-y-2.5">
                {items.map((p) => {
                  const cl = clients.find((c) => c.id === p.clientId);
                  const n = daysUntil(p.due);
                  return (
                    <article
                      key={p.id}
                      draggable
                      onDragStart={() => setDrag(p.id)}
                      onDragEnd={() => setDrag(null)}
                      className={clsx("group cursor-grab rounded-xl border border-line bg-surface p-3.5 shadow-sm transition-[box-shadow,transform,opacity] hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing", drag === p.id && "opacity-50")}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-ink-2">{cl?.name ?? "Perso"}</span>
                        <Pill tone="info">{p.tag}</Pill>
                      </div>
                      <button onClick={() => setEditing(p)} className="text-left font-semibold hover:text-bright">{p.title}</button>
                      {p.column !== "done" && p.progress > 0 && <div className="mt-3"><Progress value={p.progress} /></div>}
                      <div className="mt-3 flex items-center justify-between text-xs text-ink-2">
                        <span className={clsx("flex items-center gap-1", p.column !== "done" && n <= 3 && "font-semibold text-down")}><CalendarDays size={13} />{shortDate(p.due)}</span>
                        {p.column !== "done" && (
                          <button onClick={() => startTimer(p.id, p.title)} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-bright opacity-0 transition-opacity group-hover:opacity-100 hover:bg-azure focus:opacity-100">
                            <Play size={11} fill="currentColor" /> Chrono
                          </button>
                        )}
                      </div>
                      <select value={p.column} onChange={(e) => moveProject(p.id, e.target.value as Column)} className="mt-2 w-full rounded-lg bg-muted px-2 py-1 text-xs md:hidden" aria-label="Déplacer">
                        {COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink-2">Glisse une carte d&apos;une colonne à l&apos;autre pour changer son statut. Clique sur son titre pour la modifier.</p>
      <Modal open={adding !== null} onClose={() => setAdding(null)} title="Nouveau projet">{adding && <ProjectForm column={adding} onDone={() => setAdding(null)} />}</Modal>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Modifier le projet">{editing && <ProjectForm key={editing.id} column={editing.column} initial={editing} onDone={() => setEditing(null)} />}</Modal>
    </>
  );
}
