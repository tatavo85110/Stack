"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { AppForm } from "@/components/AppForm";
import { useStack } from "@/lib/store";
import { Button, ButtonLink, Card, Empty, Kpi, Modal, PageHeader, Pill, Segmented, Status } from "@/components/ui";
import { Line, UptimeStrip } from "@/components/charts";
import { daysUntil, num, shortDate } from "@/lib/format";

type Tab = "apercu" | "deploiements" | "echeances" | "notes";

export default function Page() {
  return <Suspense><AppPage /></Suspense>;
}

function AppPage() {
  const id = useSearchParams().get("id") ?? "";
  const app = useStack((s) => s.apps.find((a) => a.id === id));
  const client = useStack((s) => s.clients.find((c) => c.id === app?.clientId));
  const [tab, setTab] = useState<Tab>("apercu");
  const [edit, setEdit] = useState(false);
  const router = useRouter();
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
        actions={<><Button onClick={() => setEdit(true)}><Pencil size={15} /> Modifier</Button><ButtonLink href={app.url} external variant="primary">Ouvrir le site <ExternalLink size={14} /></ButtonLink></>}
      />
      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-2">
        <Status s={app.status} />
        <Pill>{app.stack}</Pill>
        <Pill>{app.host}</Pill>
        {client ? <Link href={`/clients/fiche?id=${client.id}`}><Pill tone="info">Client : {client.name}</Pill></Link> : <Pill>Perso</Pill>}
      </div>
      <div className="mb-5">
        <Segmented<Tab> value={tab} onChange={setTab} options={[{ value: "apercu", label: "Vue d'ensemble" }, { value: "deploiements", label: "Déploiements" }, { value: "echeances", label: "Échéances" }, { value: "notes", label: "Accès et notes" }]} />
      </div>

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
              <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-ink-2">Le monitoring automatique (vérification du site toutes les 5 min) n&apos;est pas encore branché. En attendant, règle l&apos;état avec « Modifier ».</p>
            </Card>
          </div>
        </div>
      )}

      {tab === "deploiements" && (
        <Card title="Derniers déploiements">
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
          ) : <Empty>Aucun déploiement enregistré.</Empty>}
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
          <Card title="Rappels">
            <p className="text-sm text-ink-2">Les échéances à moins de 45 jours apparaissent sur ton accueil. Change les dates avec « Modifier ».</p>
            <Button className="mt-4" onClick={() => setEdit(true)}><Pencil size={15} /> Modifier les dates</Button>
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
