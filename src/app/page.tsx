"use client";
import Link from "next/link";
import { ArrowRight, Play, Video, Plus, ExternalLink, AlertTriangle } from "lucide-react";
import { useStack } from "@/lib/store";
import { Card, Kpi, Progress, Pill, Button, ButtonLink, Avatar } from "@/components/ui";
import { Bars } from "@/components/charts";
import { AppRow, ShortcutIcon, TodoList } from "@/components/blocks";
import { eur, longDate, daysUntil, shortDate, hours, INDY_URL, initialsOf } from "@/lib/format";
import { revenueByMonth, revenueThisMonth, deadlines, weekMinutes, recurring } from "@/lib/stats";
import type { Stage } from "@/lib/types";

const STAGES: Stage[] = ["Prospect", "Devis envoyé", "Signé", "Actif"];

export default function Home() {
  const { apps, clients, projects, time, contracts, shortcuts, timer, startTimer } = useStack();
  const down = apps.filter((a) => a.status === "down");
  const week = weekMinutes(time);
  const weekTotal = week.reduce((a, d) => a + d.value, 0);
  const months = revenueByMonth(clients, 6);
  const current = projects.find((p) => p.column === "doing");
  const currentClient = clients.find((c) => c.id === current?.clientId);
  const dl = deadlines(apps, 45).slice(0, 4);
  const next = clients.filter((c) => c.nextAction).sort((a, b) => a.nextAction!.date.localeCompare(b.nextAction!.date))[0];
  const toBill = contracts.reduce((a, c) => a + c.monthly, 0);
  const today = longDate();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-2 first-letter:uppercase">{today}</p>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Bonjour Mathéo</h1>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/clients/stats">Rapport du mois</ButtonLink>
          <ButtonLink href={INDY_URL} external variant="primary">
            Ouvrir Indy <ExternalLink size={14} />
          </ButtonLink>
        </div>
      </div>

      {down.length > 0 && (
        <Link href={`/applis/fiche?id=${down[0].id}`} className="animate-pop flex items-center gap-3 rounded-2xl bg-down-bg px-4 py-3 text-sm font-semibold text-down transition-opacity hover:opacity-90">
          <AlertTriangle size={18} />
          {down[0].name} est hors ligne. Voir la fiche
          <ArrowRight size={16} className="ml-auto" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="night" label="CA de ce mois" value={eur(revenueThisMonth(clients))} hint="Selon tes factures importées d'Indy" />
        <Kpi label="Applis en ligne" value={`${apps.filter((a) => a.status !== "down").length} / ${apps.length}`} hint={down.length ? `${down.length} hors ligne` : "Tout va bien"} />
        <Kpi tone="ice" label="Clients actifs" value={clients.filter((c) => c.stage === "Actif" || c.stage === "Signé").length} hint={`${clients.filter((c) => c.stage === "Prospect" || c.stage === "Devis envoyé").length} en cours de signature`} />
        <Kpi tone="plain" label="Temps cette semaine" value={hours(weekTotal)} hint={`${eur(recurring(contracts))} de maintenance / mois`} />
      </div>

      <Card title="Raccourcis" action={<Link href="/raccourcis" className="text-sm font-semibold text-bright hover:underline">Tout voir</Link>}>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {shortcuts.slice(0, 9).map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pr-4 pl-1.5 text-sm font-semibold transition-[background,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:bg-azure hover:shadow-md">
              <ShortcutIcon s={s} size={32} />
              {s.name}
            </a>
          ))}
          <Link href="/raccourcis?ajout=1" className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-bright hover:text-bright">
            <Plus size={16} /> Ajouter
          </Link>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Ma semaine" action={<span className="text-sm font-bold">{hours(weekTotal)}</span>}>
          <Bars data={week.map((d) => ({ label: d.label, value: Math.round(d.value / 6) / 10 }))} highlight={(new Date().getDay() + 6) % 7} format={(v) => `${v} h`} height={150} />
        </Card>
        <Card title="Échéances" action={<Link href="/applis" className="text-sm font-semibold text-bright hover:underline">Applis</Link>}>
          <ul className="space-y-2.5">
            {dl.map((d) => {
              const n = daysUntil(d.date);
              return (
                <li key={d.app.id + d.kind} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{d.kind} · {d.app.name}</p>
                    <p className="text-xs text-ink-2">le {shortDate(d.date)}</p>
                  </div>
                  <Pill tone={n <= 7 ? "down" : n <= 30 ? "warn" : "info"}>J-{n}</Pill>
                </li>
              );
            })}
            {!dl.length && <p className="text-sm text-ink-2">Rien dans les 45 prochains jours.</p>}
          </ul>
        </Card>
        <Card title="Mes applis" action={<Link href="/applis" className="text-sm font-semibold text-bright hover:underline">Tout voir</Link>}>
          <div className="-m-2.5 space-y-0.5">
            {apps.slice(0, 4).map((a) => <AppRow key={a.id} app={a} />)}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Tâches du jour">
          <TodoList />
        </Card>
        <Card title="Chiffre d'affaires, 6 mois" action={<Link href="/clients/stats" className="text-sm font-semibold text-bright hover:underline">Stats</Link>}>
          <Bars data={months} highlight={months.length - 1} format={eur} height={170} />
        </Card>
        {current && (
          <section className="flex flex-col rounded-2xl bg-night p-5 text-white shadow-card">
            <p className="text-xs font-semibold text-sky">Projet en cours</p>
            <h2 className="mt-1 text-xl font-extrabold">{current.title}</h2>
            <p className="text-sm text-white/70">{currentClient?.name ?? "Perso"} · rendu le {shortDate(current.due)}</p>
            <div className="mt-5 mb-1 flex justify-between text-xs text-white/70">
              <span>Avancement</span>
              <span className="font-bold text-white">{current.progress} %</span>
            </div>
            <div className="h-2 rounded-full bg-white/15">
              <div className="h-full rounded-full bg-sky" style={{ width: `${current.progress}%` }} />
            </div>
            <div className="mt-auto flex gap-2 pt-5">
              <Button variant="accent" onClick={() => startTimer(current.id, current.title)} disabled={timer?.projectId === current.id}>
                <Play size={14} fill="currentColor" /> {timer?.projectId === current.id ? "Chrono lancé" : "Lancer le chrono"}
              </Button>
              <ButtonLink href="/projets" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40">Ouvrir le projet</ButtonLink>
            </div>
          </section>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Pipeline commercial" action={<Link href="/clients" className="text-sm font-semibold text-bright hover:underline">Clients</Link>}>
          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((s) => {
              const list = clients.filter((c) => c.stage === s);
              return (
                <Link key={s} href="/clients" className="rounded-xl bg-muted p-3 transition-colors hover:bg-azure">
                  <p className="text-xs font-semibold text-ink-2">{s}</p>
                  <p className="text-xl font-extrabold">{list.length}</p>
                  <div className="mt-1 flex -space-x-1.5">
                    {list.slice(0, 4).map((c) => <Avatar key={c.id} text={initialsOf(c.name)} className="size-6 rounded-full text-[9px] ring-2 ring-muted" />)}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
        <Card title="Prochain rendez-vous client">
          {next ? (
            <div className="flex h-full flex-col">
              <Link href={`/clients/fiche?id=${next.id}`} className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-muted">
                <Avatar text={initialsOf(next.name)} />
                <div>
                  <p className="text-sm font-bold">{next.name}</p>
                  <p className="text-xs text-ink-2">{next.contact}</p>
                </div>
              </Link>
              <p className="mt-4 text-sm font-semibold">{next.nextAction!.label}</p>
              <p className="text-xs text-ink-2">le {shortDate(next.nextAction!.date)}</p>
              <div className="mt-4">
                <ButtonLink href="https://meet.google.com/new" external variant="primary">
                  <Video size={15} /> Rejoindre la visio
                </ButtonLink>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-2">Aucun rendez-vous prévu.</p>
          )}
        </Card>
        <Card title="Maintenance à facturer">
          <p className="text-3xl font-extrabold tracking-tight">{eur(toBill)}</p>
          <p className="mb-4 text-sm text-ink-2">{contracts.length} contrats ce mois-ci</p>
          <div className="space-y-3">
            {contracts.slice(0, 3).map((c) => {
              const cl = clients.find((x) => x.id === c.clientId);
              const pct = (c.hoursUsed / c.hoursIncluded) * 100;
              return (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold">{cl?.name}</span>
                    <span className="text-ink-2">{c.hoursUsed} / {c.hoursIncluded} h</span>
                  </div>
                  <Progress value={pct} tone={pct >= 90 ? "warn" : "bright"} />
                </div>
              );
            })}
          </div>
          <ButtonLink href={INDY_URL} external className="mt-5 w-full">
            Facturer dans Indy <ExternalLink size={14} />
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
