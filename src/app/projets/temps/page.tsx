"use client";
import { useState } from "react";
import { Play, Square, Plus } from "lucide-react";
import { useStack } from "@/lib/store";
import { Button, Card, Field, Kpi, Modal, PageHeader, Pill, inputCls } from "@/components/ui";
import { Bars } from "@/components/charts";
import { ProjectsTabs } from "@/components/ProjectsTabs";
import { useElapsed } from "@/components/TimerBar";
import { eur, hours, isoIn, shortDate } from "@/lib/format";
import { weekMinutes } from "@/lib/stats";


function ManualEntry({ onDone }: { onDone: () => void }) {
  const { projects, addTimeEntry } = useStack();
  const [f, setF] = useState({ projectId: projects.find((p) => p.column !== "done")?.id ?? "", label: "", date: isoIn(0), h: "1", m: "0", billable: true });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const minutes = Number(f.h) * 60 + Number(f.m); if (!f.projectId || !minutes) return; addTimeEntry({ projectId: f.projectId, label: f.label || "Travail", date: f.date, minutes, billable: f.billable }); onDone(); }}>
      <Field label="Projet"><select className={inputCls} value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
      <Field label="Tâche"><input className={inputCls} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Ex. Intégration de la page contact" /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Heures"><input type="number" min="0" className={inputCls} value={f.h} onChange={(e) => setF({ ...f, h: e.target.value })} /></Field>
        <Field label="Minutes"><input type="number" min="0" max="59" step="5" className={inputCls} value={f.m} onChange={(e) => setF({ ...f, m: e.target.value })} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.billable} onChange={(e) => setF({ ...f, billable: e.target.checked })} className="size-4 accent-[var(--bright)]" /> Facturable</label>
      <div className="flex justify-end gap-2"><Button type="button" onClick={onDone}>Annuler</Button><Button variant="primary">Enregistrer</Button></div>
    </form>
  );
}

export default function Temps() {
  const RATE = useStack((st) => st.settings.hourlyRate) || 55;
  const { time, projects, clients, timer, startTimer, stopTimer } = useStack();
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState(projects.find((p) => p.column === "doing")?.id ?? projects[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const cur = pick || projects.find((p) => p.column !== "done")?.id || "";
  const elapsed = useElapsed(timer?.startedAt);
  const week = weekMinutes(time);
  const weekIsos = new Set(week.map((d) => d.iso));
  const weekEntries = time.filter((t) => weekIsos.has(t.date));
  const total = weekEntries.reduce((a, t) => a + t.minutes, 0);
  const billable = weekEntries.filter((t) => t.billable).reduce((a, t) => a + t.minutes, 0);
  const proj = (id: string) => projects.find((p) => p.id === id);

  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Projets", href: "/projets" }, { label: "Temps" }]} title="Suivi du temps" actions={<><ProjectsTabs value="temps" /><Button onClick={() => setAdding(true)}><Plus size={16} /> Saisie manuelle</Button></>} />
      <section className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl bg-night p-5 text-white">
        {timer ? (
          <>
            <span className="size-3 animate-pulse rounded-full bg-sky" />
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-sky">En cours</p><p className="truncate text-lg font-bold">{timer.label} · {proj(timer.projectId)?.title}</p></div>
            <span className="font-mono text-3xl font-extrabold tabular-nums">{elapsed}</span>
            <Button variant="accent" onClick={stopTimer}><Square size={13} fill="currentColor" /> Arrêter</Button>
          </>
        ) : (
          <>
            <select value={cur} onChange={(e) => setPick(e.target.value)} className="rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white outline-none [&>option]:text-ink">
              {projects.filter((p) => p.column !== "done").map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Sur quoi tu travailles ?" className="min-w-48 flex-1 rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/50 focus:bg-white/15" />
            <span className="font-mono text-3xl font-extrabold text-white/40 tabular-nums">00:00:00</span>
            <Button variant="accent" disabled={!cur} onClick={() => cur && startTimer(cur, label || proj(cur)?.title || "Travail")}><Play size={13} fill="currentColor" /> Démarrer</Button>
            {!projects.length && <p className="w-full text-xs text-white/70">Crée d&apos;abord un projet dans l&apos;onglet Kanban pour pouvoir lancer le chrono.</p>}
          </>
        )}
      </section>
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card title="Cette semaine"><Bars data={week.map((d) => ({ label: d.label, value: Math.round(d.value / 6) / 10 }))} highlight={(new Date().getDay() + 6) % 7} format={(v) => `${v} h`} height={180} /></Card>
        <div className="grid gap-3">
          <Kpi tone="night" label="Total semaine" value={hours(total)} />
          <Kpi label="Facturable" value={hours(billable)} />
          <Kpi tone="ice" label={`Valeur facturable (${RATE} €/h)`} value={eur((billable / 60) * RATE)} />
        </div>
      </div>
      <Card title="Saisies récentes" className="overflow-hidden">
        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead><tr className="border-y border-line text-left text-xs text-ink-2">{["Tâche", "Projet", "Date", "Durée", "Facturable"].map((h) => <th key={h} className="px-5 py-2.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {time.slice(0, 20).map((t) => {
                const p = proj(t.projectId);
                return (
                  <tr key={t.id} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3 font-semibold">{t.label}</td>
                    <td className="px-5 py-3 text-ink-2">{p?.title} · {clients.find((c) => c.id === p?.clientId)?.name ?? "Perso"}</td>
                    <td className="px-5 py-3 text-ink-2">{shortDate(t.date)}</td>
                    <td className="px-5 py-3 font-semibold">{hours(t.minutes)}</td>
                    <td className="px-5 py-3"><Pill tone={t.billable ? "ok" : "neutral"}>{t.billable ? "Oui" : "Non"}</Pill></td>
                  </tr>
                );
              })}
              {!time.length && <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-2">Aucune saisie pour l&apos;instant.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={adding} onClose={() => setAdding(false)} title="Saisie manuelle"><ManualEntry onDone={() => setAdding(false)} /></Modal>
    </>
  );
}
