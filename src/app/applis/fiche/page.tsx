"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil, RefreshCw, Share2, Bug, Search, Check } from "lucide-react";
import { pingUrl } from "@/lib/monitor";
import { fetchDeploys, fetchDomainExpiry, fetchSentry } from "@/lib/integrations";
import { pack, baseUrl, type StatusData } from "@/lib/share";
import { AppForm } from "@/components/AppForm";
import { useStack } from "@/lib/store";
import { Button, ButtonLink, Card, Empty, Kpi, Modal, PageHeader, Pill, Segmented, Status } from "@/components/ui";
import { Line, UptimeStrip } from "@/components/charts";
import { daysUntil, num, shortDate } from "@/lib/format";

type Tab = "apercu" | "erreurs" | "deploiements" | "echeances" | "notes";

export default function Page() {
  return <Suspense><AppPage /></Suspense>;
}

function AppPage() {
  const id = useSearchParams().get("id") ?? "";
  const app = useStack((s) => s.apps.find((a) => a.id === id));
  const client = useStack((s) => s.clients.find((c) => c.id === app?.clientId));
  const [tab, setTab] = useState<Tab>("apercu");
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { updateApp, recordCheck, settings } = useStack();
  const router = useRouter();
  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setBusy("");
    }
  };
  if (!app) return <Empty>Cette appli n&apos;existe pas. <Link className="text-bright" href="/applis">Retour aux applis</Link></Empty>;

  const dl = [
    { kind: "Nom de domaine", date: app.domainExpiry },
    { kind: "Certificat SSL", date: app.sslExpiry },
    { kind: "Hébergement", date: app.hostingRenewal },
  ].filter((d) => d.date);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Stack", href: "/" }, { label: "Applis", href: "/applis" }, { label: app.name }]}
        title={app.name}
        actions={<>
          <Button disabled={busy === "check"} onClick={() => run("check", async () => { const r = await pingUrl(app.url); recordCheck(app.id, { t: Date.now(), ...r }); return r.ok ? `Le site répond (${r.ms} ms).` : "Le site ne répond pas."; })}><RefreshCw size={15} className={busy === "check" ? "animate-spin" : ""} /> Vérifier</Button>
          <Button disabled={busy === "share"} onClick={() => run("share", async () => { const d: StatusData = { v: 1, name: app.name, url: app.url, uptime: app.uptime, series: app.uptimeSeries, at: new Date().toISOString() }; const link = `${baseUrl()}/statut/#d=${await pack(d)}`; await navigator.clipboard?.writeText(link).catch(() => {}); return `Lien de la page de statut copié : ${link.slice(0, 60)}…`; })}><Share2 size={15} /> Page de statut</Button>
          <Button onClick={() => setEdit(true)}><Pencil size={15} /> Modifier</Button><ButtonLink href={app.url} external variant="primary">Ouvrir le site <ExternalLink size={14} /></ButtonLink></>}
      />
      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-2">
        <Status s={app.status} />
        <Pill>{app.stack}</Pill>
        <Pill>{app.host}</Pill>
        {client ? <Link href={`/clients/fiche?id=${client.id}`}><Pill tone="info">Client : {client.name}</Pill></Link> : <Pill>Perso</Pill>}
      </div>
      <div className="mb-5">
        <Segmented<Tab> value={tab} onChange={setTab} options={[{ value: "apercu", label: "Vue d'ensemble" }, { value: "erreurs", label: `Erreurs${app.sentryIssues?.length ? ` (${app.sentryIssues.length})` : ""}` }, { value: "deploiements", label: "Déploiements" }, { value: "echeances", label: "Échéances" }, { value: "notes", label: "Accès et notes" }]} />
      </div>

      {msg && <p className={`mb-5 rounded-xl p-3 text-sm font-semibold break-all ${msg.ok ? "bg-ok-bg text-ok" : "bg-down-bg text-down"}`}>{msg.text}</p>}
      {tab === "apercu" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi tone="night" label="Disponibilité 30 j" value={app.uptime >= 0 ? `${num(app.uptime, 2)} %` : "—"} />
            <Kpi label="Temps de réponse" value={app.responseMs ? `${app.responseMs} ms` : "—"} />
            <Kpi tone="ice" label="Erreurs 7 j" value={app.errors7d} />
            <Kpi tone="plain" label="Dernier déploiement" value={app.deploys[0] ? shortDate(app.deploys[0].date) : "—"} />
          </div>
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <Card title="Temps de réponse, 24 h">{app.responseSeries.length ? <Line values={app.responseSeries} height={180} /> : <Empty>Pas encore de mesure.</Empty>}</Card>
            <Card title="Disponibilité, 30 jours">
              {app.uptimeSeries.length ? <><UptimeStrip values={app.uptimeSeries} /><p className="mt-3 text-xs text-ink-2">Chaque case est un jour. Vert : en ligne toute la journée.</p></> : <Empty>Pas encore de mesure.</Empty>}
              <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-ink-2">Stack vérifie tes sites toutes les {settings.monitorMinutes} min tant qu&apos;il est ouvert (sur un de tes appareils). {app.checks?.length ? `${app.checks.length} vérifications enregistrées, la dernière à ${new Date(app.checks[0].t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.` : ""}</p>
            </Card>
          </div>
        </div>
      )}

      {tab === "erreurs" && (
        <Card title="Erreurs Sentry non résolues (14 jours)" action={<Button disabled={busy === "sentry"} onClick={() => run("sentry", async () => { const issues = await fetchSentry(app, useStack.getState().settings); updateApp(app.id, { sentryIssues: issues, errors7d: issues.filter((i) => Date.now() - new Date(i.lastSeen).getTime() < 7 * 86_400_000).length, sentryCheckedAt: new Date().toISOString() }); return `${issues.length} erreur${issues.length > 1 ? "s" : ""} ouverte${issues.length > 1 ? "s" : ""}.`; })}><Bug size={15} /> Actualiser</Button>}>
          {app.sentryIssues?.length ? (
            <ul className="divide-y divide-line">
              {app.sentryIssues.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1"><a href={i.permalink} target="_blank" rel="noreferrer" className="block truncate font-semibold hover:text-bright">{i.title}</a><p className="truncate text-xs text-ink-2">{i.culprit}</p></div>
                  <Pill tone={i.level === "error" || i.level === "fatal" ? "down" : "warn"}>{i.count} fois</Pill>
                  <span className="text-xs text-ink-2">{shortDate(i.lastSeen)}</span>
                  <Link href="/assistant" className="text-xs font-semibold text-bright">Analyser avec Claude</Link>
                </li>
              ))}
            </ul>
          ) : <Empty>{app.sentryProject ? (app.sentryCheckedAt ? "Aucune erreur ouverte. Bravo." : "Clique sur Actualiser pour charger les erreurs.") : "Renseigne le projet Sentry avec « Modifier », et ton jeton dans Réglages."}</Empty>}
        </Card>
      )}

      {tab === "deploiements" && (
        <Card title="Derniers déploiements" action={app.deployProvider ? <Button disabled={busy === "deploys"} onClick={() => run("deploys", async () => { const deploys = await fetchDeploys(app, useStack.getState().settings); updateApp(app.id, { deploys }); return `${deploys.length} déploiements chargés depuis ${app.deployProvider}.`; })}><RefreshCw size={15} /> Actualiser</Button> : undefined}>
          {app.deploys.length ? (
            <ul className="divide-y divide-line">
              {app.deploys.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <code className="flex-1 truncate text-sm">{d.message}</code>
                  <span className="text-xs text-ink-2">{shortDate(d.date)}</span>
                  <Pill tone={d.status === "Réussi" ? "ok" : d.status === "Échoué" ? "down" : "info"}>{d.status}</Pill>
                </li>
              ))}
            </ul>
          ) : <Empty>{app.deployProvider ? "Clique sur Actualiser." : "Choisis Vercel, Netlify ou Coolify avec « Modifier » pour voir tes déploiements ici."}</Empty>}
        </Card>
      )}

      {tab === "echeances" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Échéances">
            <ul className="space-y-3">
              {dl.map((d) => {
                const n = daysUntil(d.date);
                return (
                  <li key={d.kind} className="flex items-center justify-between rounded-xl bg-muted p-3">
                    <div><p className="text-sm font-semibold">{d.kind}</p><p className="text-xs text-ink-2">le {shortDate(d.date)}</p></div>
                    <Pill tone={n <= 7 ? "down" : n <= 30 ? "warn" : "ok"}>{n <= 30 ? `J-${n}` : "OK"}</Pill>
                  </li>
                );
              })}
              {!dl.length && <Empty>Aucune échéance renseignée.</Empty>}
            </ul>
          </Card>
          <Card title="Rappels et sauvegardes">
            <p className="text-sm text-ink-2">Les échéances à moins de 45 jours apparaissent sur ton accueil, et une alerte part 14 jours avant si les alertes sont activées.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={busy === "rdap"} onClick={() => run("rdap", async () => { const d = await fetchDomainExpiry(app.url); updateApp(app.id, { domainExpiry: d }); return `Fin du domaine trouvée : ${new Date(d).toLocaleDateString("fr-FR")}.`; })}><Search size={15} /> Trouver la fin du domaine</Button>
              <Button onClick={() => setEdit(true)}><Pencil size={15} /> Modifier les dates</Button>
            </div>
            <div className="mt-5 rounded-xl bg-muted p-3">
              <p className="text-sm font-semibold">Dernière sauvegarde : {app.lastBackup ? new Date(app.lastBackup).toLocaleDateString("fr-FR") : "jamais notée"}</p>
              {app.lastBackup && app.backupEveryDays && -daysUntil(app.lastBackup) > app.backupEveryDays && <p className="mt-1 text-xs font-semibold text-down">En retard : une sauvegarde est prévue tous les {app.backupEveryDays} jours.</p>}
              <Button className="mt-3" onClick={() => { updateApp(app.id, { lastBackup: new Date().toISOString().slice(0, 10), backupEveryDays: app.backupEveryDays ?? 7 }); setMsg({ ok: true, text: "Sauvegarde vérifiée aujourd'hui." }); }}><Check size={15} /> J&apos;ai vérifié une sauvegarde aujourd&apos;hui</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "notes" && (
        <Card title="Accès et notes">
          <dl className="grid gap-3 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-ink-2">Adresse</dt><dd><a className="font-semibold text-bright" href={app.url} target="_blank" rel="noreferrer">{app.url}</a></dd>
            <dt className="text-ink-2">Hébergeur</dt><dd className="font-semibold">{app.host}</dd>
            <dt className="text-ink-2">Notes</dt><dd>{app.notes || "—"}</dd>
          </dl>
          <p className="mt-5 rounded-xl bg-warn-bg p-3 text-xs text-warn">Ne mets jamais de mot de passe ici : garde-les dans ton gestionnaire de mots de passe.</p>
        </Card>
      )}
      <Modal open={edit} onClose={() => setEdit(false)} title="Modifier l'appli"><AppForm initial={app} onDone={() => setEdit(false)} onDeleted={() => router.push("/applis")} /></Modal>
    </>
  );
}
