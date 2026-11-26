"use client";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import { Plus, Play, CalendarDays, X, GripVertical } from "lucide-react";
import { useStack, uid } from "@/lib/store";
import type { Column, Deliverable, Project, Todo } from "@/lib/types";
import { Button, Field, Kpi, Modal, PageHeader, Pill, Progress, inputCls } from "@/components/ui";
import { ProjectsTabs } from "@/components/ProjectsTabs";
import { daysUntil, hours, isoIn, shortDate } from "@/lib/format";
import { weekMinutes } from "@/lib/stats";

/** Project types offered in the form; "Autre…" lets Mathéo type his own. */
const PROJECT_TYPES = ["Site web", "Application web", "Maintenance", "Graphisme", "Print", "Identité visuelle", "Conseil"];

function TypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const used = useStack(useShallow((s) => s.projects.map((p) => p.tag)));
  const options = [...new Set([...PROJECT_TYPES, ...used.filter(Boolean)])];
  const [free, setFree] = useState(!!value && !options.includes(value));
  return (
    <Field label="Type de projet">
      {free ? (
        <div className="flex gap-2">
          <input className={inputCls} autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder="Ex. Faire-part de mariage, Logo, Flyer" />
          <Button type="button" onClick={() => { setFree(false); if (!options.includes(value)) onChange(""); }} aria-label="Revenir à la liste"><X size={16} /></Button>
        </div>
      ) : (
        <select className={inputCls} value={value} onChange={(e) => (e.target.value === "__free" ? (setFree(true), onChange("")) : onChange(e.target.value))}>
          <option value="">Non précisé</option>
          {options.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value="__free">Autre… (écrire le type)</option>
        </select>
      )}
    </Field>
  );
}

const COLS: { id: Column; label: string }[] = [
  { id: "todo", label: "À faire" },
  { id: "doing", label: "En cours" },
  { id: "review", label: "En revue" },
  { id: "done", label: "Terminé" },
];

function ProjectForm({ column, initial, onDone }: { column: Column; initial?: Project; onDone: () => void }) {
  const { clients, templates, addProject, updateProject, removeProject } = useStack();
  const [f, setF] = useState({ title: initial?.title ?? "", clientId: initial?.clientId ?? "", due: initial?.due ?? isoIn(14), tag: initial?.tag ?? "", progress: initial?.progress ?? 0 });
  const [tasks, setTasks] = useState<Todo[]>(initial?.tasks ?? []);
  const [deliv, setDeliv] = useState<Deliverable[]>(initial?.deliverables ?? []);
  const [newTask, setNewTask] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  // Drag a step by its handle (mouse or finger) to change its position.
  const onGripMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-step]")?.dataset.step;
    if (!over || over === dragId) return;
    setTasks((list) => {
      const from = list.findIndex((x) => x.id === dragId), to = list.findIndex((x) => x.id === over);
      if (from < 0 || to < 0) return list;
      const next = [...list]; const [m] = next.splice(from, 1); next.splice(to, 0, m); return next;
    });
  };
  const [d, setD] = useState({ label: "", url: "https://" });
  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setF({ ...f, tag: t.tag, due: isoIn(t.days), title: f.title || t.name });
    setTasks(t.tasks.map((label) => ({ id: uid(), label, done: false })));
  };
  const auto = tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : null;
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (!f.title.trim()) return;
      const data = { ...f, progress: auto ?? f.progress, title: f.title.trim(), clientId: f.clientId || undefined, tasks, deliverables: deliv };
      if (initial) updateProject(initial.id, data); else addProject({ ...data, column });
      onDone();
    }}>
      {!initial && templates.length > 0 && (
        <Field label="Partir d'un modèle">
          <select className={inputCls} defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">Projet vide</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.tasks.length} étapes)</option>)}
          </select>
        </Field>
      )}
      <Field label="Titre"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Client">
          <select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">Perso</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Échéance"><input type="date" className={inputCls} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
      </div>
      <TypePicker value={f.tag} onChange={(tag) => setF((x) => ({ ...x, tag }))} />
      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-2">Étapes {auto !== null && `(avancement calculé : ${auto} %)`}</p>
        <ul className="space-y-1">
          {tasks.map((t) => (
            <li key={t.id} data-step={t.id} className={clsx("flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm transition-shadow", dragId === t.id && "relative z-10 shadow-md ring-2 ring-[var(--bright)]")}>
              {tasks.length > 1 && (
                <span
                  role="button"
                  aria-label="Glisser pour déplacer l'étape"
                  title="Glisser pour déplacer"
                  className="-ml-1 cursor-grab touch-none text-ink-2 active:cursor-grabbing"
                  onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDragId(t.id); }}
                  onPointerMove={onGripMove}
                  onPointerUp={() => setDragId(null)}
                  onPointerCancel={() => setDragId(null)}
                ><GripVertical size={15} /></span>
              )}
              <input type="checkbox" checked={t.done} onChange={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} className="size-4 accent-[var(--bright)]" aria-label={t.label} />
              <span className={clsx("flex-1", t.done && "text-ink-2 line-through")}>{t.label}</span>
              <button type="button" onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))} className="text-ink-2 hover:text-down" aria-label="Retirer l'étape"><X size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="mt-1.5 flex gap-2">
          <input className={inputCls} placeholder="Ajouter une étape" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newTask.trim()) { setTasks([...tasks, { id: uid(), label: newTask.trim(), done: false }]); setNewTask(""); } } }} />
          <Button type="button" onClick={() => { if (newTask.trim()) { setTasks([...tasks, { id: uid(), label: newTask.trim(), done: false }]); setNewTask(""); } }}><Plus size={15} /></Button>
        </div>
      </div>
      {auto === null && <Field label={`Avancement : ${f.progress} %`}><input type="range" min="0" max="100" step="5" value={f.progress} onChange={(e) => setF({ ...f, progress: Number(e.target.value) })} className="w-full accent-[var(--bright)]" /></Field>}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-2">Livrables (visibles dans le portail du client)</p>
        <ul className="space-y-1">
          {deliv.map((x) => (
            <li key={x.id} className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm">
              <a href={x.url} target="_blank" rel="noreferrer" className="flex-1 truncate font-semibold text-bright">{x.label}</a>
              <span className="text-xs text-ink-2">{shortDate(x.date)}</span>
              <button type="button" onClick={() => setDeliv(deliv.filter((y) => y.id !== x.id))} className="text-ink-2 hover:text-down" aria-label="Retirer le livrable"><X size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="mt-1.5 grid grid-cols-[1fr_1fr_auto] gap-2">
          <input className={inputCls} placeholder="Nom (ex. maquettes)" value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />
          <input className={inputCls} placeholder="Lien" value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} />
          <Button type="button" onClick={() => { if (d.label.trim() && d.url.length > 8) { setDeliv([...deliv, { id: uid(), label: d.label.trim(), url: d.url.trim(), date: new Date().toISOString().slice(0, 10) }]); setD({ label: "", url: "https://" }); } }}><Plus size={15} /></Button>
        </div>
      </div>
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
  const types = [...new Set(projects.map((p) => p.tag).filter(Boolean))];
  const [type, setType] = useState<string | null>(null);

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
      {types.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {[null, ...types].map((t) => (
            <button key={t ?? "__all"} onClick={() => setType(t)} className={clsx("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors", type === t ? "bg-night text-white dark:bg-bright" : "bg-surface text-ink-2 shadow-card hover:text-ink")}>
              {t ?? "Tous"} <span className="opacity-60">{t === null ? projects.length : projects.filter((p) => p.tag === t).length}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLS.map((col) => {
          const items = projects.filter((p) => p.column === col.id && (type === null || p.tag === type));
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
                        {p.tag && <Pill tone="info">{p.tag}</Pill>}
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
