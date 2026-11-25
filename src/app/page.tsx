"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { ArrowRight, Play, Video, Plus, ExternalLink, AlertTriangle, LayoutGrid, ArrowUp, ArrowDown, Eye, EyeOff, Link2, Users, FolderKanban, FileUp, Sparkles } from "lucide-react";
import { useStack, DEFAULT_WIDGETS } from "@/lib/store";
import { Card, Kpi, Pill, Button, ButtonLink, Avatar, Modal, Empty } from "@/components/ui";
import { Bars } from "@/components/charts";
import { AppRow, ShortcutIcon, TodoList } from "@/components/blocks";
import { eur, longDate, daysUntil, shortDate, hours, INDY_URL, initialsOf } from "@/lib/format";
import { revenueByMonth, revenueThisMonth, deadlines, weekMinutes, monthlyAverage } from "@/lib/stats";
import type { Stage } from "@/lib/types";

const STAGES: Stage[] = ["Prospect", "Devis envoyé", "Signé", "Actif"];

const CATALOG: { id: string; label: string; desc: string; wide?: boolean }[] = [
  { id: "kpis", label: "Chiffres clés", desc: "CA du mois, applis en ligne, clients actifs, temps de la semaine", wide: true },
  { id: "raccourcis", label: "Raccourcis", desc: "Tes liens favoris en un clic", wide: true },
  { id: "semaine", label: "Ma semaine", desc: "Heures travaillées par jour" },
  { id: "echeances", label: "Échéances", desc: "Domaines, SSL et hébergements à renouveler" },
  { id: "applis", label: "Mes applis", desc: "État de tes sites et applis" },
  { id: "taches", label: "Tâches du jour", desc: "Ta liste à cocher" },
  { id: "ca", label: "Chiffre d'affaires", desc: "CA des 6 derniers mois, depuis Indy" },
  { id: "projet", label: "Projet en cours", desc: "Avancement et chrono" },
  { id: "pipeline", label: "Pipeline commercial", desc: "Prospects, devis, signés, actifs" },
  { id: "rdv", label: "Prochaine action client", desc: "Le prochain rendez-vous ou relance" },
  { id: "note", label: "Note libre", desc: "Un bloc-notes pour ce que tu veux" },
];

function WidgetsEditor({ onDone }: { onDone: () => void }) {
  const { widgets, setWidgets } = useStack();
  const [list, setList] = useState(widgets);
  const hidden = CATALOG.filter((c) => !list.includes(c.id));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    setList(n);
  };
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Sur ton accueil</p>
        <ul className="space-y-1.5">
          {list.map((id, i) => {
            const w = CATALOG.find((c) => c.id === id);
            if (!w) return null;
            return (
              <li key={id} className="animate-pop flex items-center gap-2 rounded-xl border border-line bg-surface p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{w.label}</p>
                  <p className="truncate text-xs text-ink-2">{w.desc}</p>
                </div>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-ink-2 hover:bg-muted disabled:opacity-30" aria-label="Monter"><ArrowUp size={15} /></button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded-lg p-1.5 text-ink-2 hover:bg-muted disabled:opacity-30" aria-label="Descendre"><ArrowDown size={15} /></button>
                <button onClick={() => setList(list.filter((x) => x !== id))} className="rounded-lg p-1.5 text-ink-2 hover:bg-muted hover:text-down" aria-label="Masquer"><EyeOff size={15} /></button>
              </li>
            );
          })}
          {!list.length && <Empty>Ton accueil est vide. Ajoute des widgets ci-dessous.</Empty>}
        </ul>
      </div>
      {hidden.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Widgets disponibles</p>
          <ul className="space-y-1.5">
            {hidden.map((w) => (
              <li key={w.id}>
                <button onClick={() => setList([...list, w.id])} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong p-2.5 text-left transition-colors hover:border-bright hover:bg-azure">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-azure text-azure-text"><Plus size={16} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{w.label}</span><span className="block truncate text-xs text-ink-2">{w.desc}</span></span>
                  <Eye size={15} className="text-ink-2" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="ghost" onClick={() => setList(DEFAULT_WIDGETS)}>Par défaut</Button>
        <Button className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary" onClick={() => { setWidgets(list); onDone(); }}>Enregistrer</Button>
      </div>
    </div>
  );
}

function Welcome() {
  const loadDemo = useStack((s) => s.loadDemo);
  const steps = [
    { href: "/raccourcis?ajout=1", icon: Link2, label: "Ajoute tes raccourcis", desc: "Indy, ta banque, GitHub… avec leur favicon" },
    { href: "/applis?ajout=1", icon: LayoutGrid, label: "Ajoute tes applis et sites", desc: "Avec leurs dates de domaine et de SSL" },
    { href: "/clients?ajout=1", icon: Users, label: "Ajoute tes clients", desc: "Ou importe-les avec un export Indy" },
    { href: "/projets", icon: FolderKanban, label: "Crée tes projets", desc: "Kanban, chrono et suivi du temps" },
    { href: "/clients/stats", icon: FileUp, label: "Importe ton CA depuis Indy", desc: "Un export CSV de tes factures" },
  ];
  return (
    <section className="animate-pop rounded-3xl bg-night p-6 text-white md:p-8">
      <p className="text-sm font-semibold text-sky">Bienvenue dans Stack</p>
      <h2 className="mt-1 text-2xl font-extrabold">Ton cockpit est vide, à toi de le remplir.</h2>
      <p className="mt-1 text-sm text-white/70">Commence par ce qui te sert le plus. Tout reste modifiable.</p>
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl bg-white/8 p-3.5 transition-colors hover:bg-white/15">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky text-night"><Icon size={18} /></span>
            <span className="min-w-0"><span className="block text-sm font-bold">{label}</span><span className="block text-xs text-white/60">{desc}</span></span>
          </Link>
        ))}
        <button onClick={loadDemo} className="flex items-center gap-3 rounded-2xl border border-dashed border-white/25 p-3.5 text-left transition-colors hover:bg-white/10">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Sparkles size={18} /></span>
          <span><span className="block text-sm font-bold">Voir avec des exemples</span><span className="block text-xs text-white/60">Tu pourras tout effacer dans Réglages</span></span>
        </button>
      </div>
    </section>
  );
}

const more = (href: string, label: string) => <Link href={href} className="text-sm font-semibold text-bright hover:underline">{label}</Link>;

export default function Home() {
  const s = useStack();
  const { apps, clients, projects, time, shortcuts, timer, startTimer, widgets, note, setNote } = s;
  const [editing, setEditing] = useState(false);
  const isEmpty = !apps.length && !clients.length && !projects.length && !shortcuts.length && !s.todos.length;
  const down = apps.filter((a) => a.status === "down");
  const week = weekMinutes(time);
  const weekTotal = week.reduce((a, d) => a + d.value, 0);
  const months = revenueByMonth(clients, 6);
  const current = projects.find((p) => p.column === "doing");
  const currentClient = clients.find((c) => c.id === current?.clientId);
  const dl = deadlines(apps, 45).slice(0, 4);
  const next = clients.filter((c) => c.nextAction).sort((a, b) => a.nextAction!.date.localeCompare(b.nextAction!.date))[0];

  const render: Record<string, () => ReactNode> = {
    kpis: () => (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="night" label="CA de ce mois" value={eur(revenueThisMonth(clients))} hint="Selon tes factures importées d'Indy" />
        <Kpi label="Applis en ligne" value={apps.length ? `${apps.filter((a) => a.status !== "down").length} / ${apps.length}` : "—"} hint={down.length ? `${down.length} hors ligne` : apps.length ? "Tout va bien" : "Aucune appli"} />
        <Kpi tone="ice" label="Clients actifs" value={clients.filter((c) => c.stage === "Actif" || c.stage === "Signé").length} hint={`${clients.filter((c) => c.stage === "Prospect" || c.stage === "Devis envoyé").length} en cours de signature`} />
        <Kpi tone="plain" label="Temps cette semaine" value={hours(weekTotal)} hint={`${eur(monthlyAverage(clients))} de CA moyen / mois`} />
      </div>
    ),
    raccourcis: () => (
      <Card title="Raccourcis" action={more("/raccourcis", "Tout voir")}>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {shortcuts.slice(0, 12).map((x) => (
            <a key={x.id} href={x.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pr-4 pl-1.5 text-sm font-semibold transition-[background,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:bg-azure hover:shadow-md">
              <ShortcutIcon s={x} size={32} />
              {x.name}
            </a>
          ))}
          <Link href="/raccourcis?ajout=1" className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-bright hover:text-bright">
            <Plus size={16} /> Ajouter
          </Link>
        </div>
      </Card>
    ),
    semaine: () => (
      <Card title="Ma semaine" action={<span className="text-sm font-bold">{hours(weekTotal)}</span>}>
        <Bars data={week.map((d) => ({ label: d.label, value: Math.round(d.value / 6) / 10 }))} highlight={(new Date().getDay() + 6) % 7} format={(v) => `${v} h`} height={150} />
      </Card>
    ),
    echeances: () => (
      <Card title="Échéances" action={more("/applis", "Applis")}>
        <ul className="space-y-2.5">
          {dl.map((d) => {
            const n = daysUntil(d.date);
            return (
              <li key={d.app.id + d.kind} className="flex items-center gap-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{d.kind} · {d.app.name}</p><p className="text-xs text-ink-2">le {shortDate(d.date)}</p></div>
                <Pill tone={n <= 7 ? "down" : n <= 30 ? "warn" : "info"}>{n < 0 ? "Expiré" : `J-${n}`}</Pill>
              </li>
            );
          })}
          {!dl.length && <p className="text-sm text-ink-2">Rien dans les 45 prochains jours. Les dates se règlent dans chaque fiche appli.</p>}
        </ul>
      </Card>
    ),
    applis: () => (
      <Card title="Mes applis" action={more("/applis", "Tout voir")}>
        {apps.length ? <div className="-m-2.5 space-y-0.5">{apps.slice(0, 4).map((a) => <AppRow key={a.id} app={a} />)}</div> : <Empty><Link className="font-semibold text-bright" href="/applis?ajout=1">Ajoute ta première appli</Link></Empty>}
      </Card>
    ),
    taches: () => <Card title="Tâches du jour"><TodoList /></Card>,
    ca: () => (
      <Card title="Chiffre d'affaires, 6 mois" action={more("/clients/stats", "Stats")}>
        <Bars data={months} highlight={months.length - 1} format={eur} height={170} />
        {!months.some((m) => m.value) && <p className="mt-2 text-xs text-ink-2">Importe un export Indy depuis la page Stats pour voir ton CA.</p>}
      </Card>
    ),
    projet: () =>
      current ? (
        <section className="flex h-full flex-col rounded-2xl bg-night p-5 text-white shadow-card">
          <p className="text-xs font-semibold text-sky">Projet en cours</p>
          <h2 className="mt-1 text-xl font-extrabold">{current.title}</h2>
          <p className="text-sm text-white/70">{currentClient?.name ?? "Perso"} · rendu le {shortDate(current.due)}</p>
          <div className="mt-5 mb-1 flex justify-between text-xs text-white/70"><span>Avancement</span><span className="font-bold text-white">{current.progress} %</span></div>
          <div className="h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-sky" style={{ width: `${current.progress}%` }} /></div>
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <Button variant="accent" onClick={() => startTimer(current.id, current.title)} disabled={timer?.projectId === current.id}>
              <Play size={14} fill="currentColor" /> {timer?.projectId === current.id ? "Chrono lancé" : "Lancer le chrono"}
            </Button>
            <ButtonLink href="/projets" className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20">Ouvrir le projet</ButtonLink>
          </div>
        </section>
      ) : (
        <Card title="Projet en cours"><Empty>Aucun projet dans la colonne « En cours ». <Link className="font-semibold text-bright" href="/projets">Ouvrir les projets</Link></Empty></Card>
      ),
    pipeline: () => (
      <Card title="Pipeline commercial" action={more("/clients", "Clients")}>
        <div className="grid grid-cols-2 gap-2">
          {STAGES.map((st) => {
            const list = clients.filter((c) => c.stage === st);
            return (
              <Link key={st} href="/clients" className="rounded-xl bg-muted p-3 transition-colors hover:bg-azure">
                <p className="text-xs font-semibold text-ink-2">{st}</p>
                <p className="text-xl font-extrabold">{list.length}</p>
                <div className="mt-1 flex h-6 -space-x-1.5">{list.slice(0, 4).map((c) => <Avatar key={c.id} text={initialsOf(c.name)} className="size-6 rounded-full text-[9px] ring-2 ring-muted" />)}</div>
              </Link>
            );
          })}
        </div>
      </Card>
    ),
    rdv: () => (
      <Card title="Prochaine action client">
        {next ? (
          <div className="flex h-full flex-col">
            <Link href={`/clients/fiche?id=${next.id}`} className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-muted">
              <Avatar text={initialsOf(next.name)} />
              <div><p className="text-sm font-bold">{next.name}</p><p className="text-xs text-ink-2">{next.contact}</p></div>
            </Link>
            <p className="mt-4 text-sm font-semibold">{next.nextAction!.label}</p>
            <p className="text-xs text-ink-2">le {shortDate(next.nextAction!.date)}</p>
            <div className="mt-4"><ButtonLink href="https://meet.google.com/new" external variant="primary"><Video size={15} /> Lancer une visio</ButtonLink></div>
          </div>
        ) : <p className="text-sm text-ink-2">Aucune action prévue. Planifie-en une depuis une fiche client.</p>}
      </Card>
    ),
    note: () => (
      <Card title="Note libre">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Écris ce que tu veux ici, c'est enregistré automatiquement." className="h-40 w-full resize-none rounded-xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-bright/30" />
      </Card>
    ),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-2 first-letter:uppercase">{longDate()}</p>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Bonjour Mathéo</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditing(true)}><Plus size={16} /> Ajouter un widget</Button>
          <ButtonLink href={INDY_URL} external variant="primary">Ouvrir Indy <ExternalLink size={14} /></ButtonLink>
        </div>
      </div>

      {isEmpty && <Welcome />}

      {down.length > 0 && (
        <Link href={`/applis/fiche?id=${down[0].id}`} className="animate-pop flex items-center gap-3 rounded-2xl bg-down-bg px-4 py-3 text-sm font-semibold text-down transition-opacity hover:opacity-90">
          <AlertTriangle size={18} />
          {down[0].name} est hors ligne. Voir la fiche
          <ArrowRight size={16} className="ml-auto" />
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {widgets.filter((id) => render[id]).map((id) => (
          <div key={id} className={clsx("animate-pop min-w-0", CATALOG.find((c) => c.id === id)?.wide && "lg:col-span-3")}>{render[id]()}</div>
        ))}
      </div>

      <button onClick={() => setEditing(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong p-5 text-sm font-semibold text-ink-2 transition-colors hover:border-bright hover:text-bright">
        <LayoutGrid size={17} /> Ajouter, ranger ou masquer des widgets
      </button>

      <Modal open={editing} onClose={() => setEditing(false)} title="Personnaliser l'accueil"><WidgetsEditor onDone={() => setEditing(false)} /></Modal>
    </div>
  );
}
