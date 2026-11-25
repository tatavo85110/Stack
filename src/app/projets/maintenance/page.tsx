"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useStack } from "@/lib/store";
import { ButtonLink, Card, Kpi, PageHeader, Pill, Progress } from "@/components/ui";
import { ProjectsTabs } from "@/components/ProjectsTabs";
import { daysUntil, eur, hours, num, shortDate, INDY_URL } from "@/lib/format";

export default function Maintenance() {
  const { contracts, clients } = useStack();
  const used = contracts.reduce((a, c) => a + c.hoursUsed, 0);
  const incl = contracts.reduce((a, c) => a + c.hoursIncluded, 0);
  const total = contracts.reduce((a, c) => a + c.monthly, 0);
  const interventions = contracts.flatMap((c) => c.interventions.map((i) => ({ ...i, client: clients.find((x) => x.id === c.clientId) }))).sort((a, b) => b.date.localeCompare(a.date));
  const status = (pct: number, renewal: string) =>
    daysUntil(renewal) <= 30 ? { tone: "warn" as const, label: "Échéance proche" } : pct >= 90 ? { tone: "warn" as const, label: "Presque épuisé" } : { tone: "ok" as const, label: "Actif" };

  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Projets", href: "/projets" }, { label: "Maintenance" }]} title="Contrats de maintenance" actions={<><ProjectsTabs value="maintenance" /><ButtonLink href={INDY_URL} external variant="primary">Facturer dans Indy <ExternalLink size={14} /></ButtonLink></>} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="night" label="Contrats actifs" value={contracts.length} />
        <Kpi label="Revenu récurrent" value={`${eur(total)} / mois`} />
        <Kpi tone="ice" label="Heures consommées" value={`${num(used, 1)} / ${incl} h`} />
        <Kpi tone="plain" label="À facturer ce mois" value={eur(total)} />
      </div>
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {contracts.map((c) => {
          const cl = clients.find((x) => x.id === c.clientId);
          const pct = (c.hoursUsed / c.hoursIncluded) * 100;
          const s = status(pct, c.renewal);
          return (
            <Card key={c.id}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <Link href={`/clients/${c.clientId}`} className="font-bold hover:text-bright">{cl?.name}</Link>
                <Pill tone={s.tone}>{s.label}</Pill>
              </div>
              <p className="text-2xl font-extrabold">{c.monthly} € <span className="text-sm font-medium text-ink-2">/ mois</span></p>
              <div className="mt-4 mb-1 flex justify-between text-xs text-ink-2"><span>Heures</span><span className="font-semibold text-ink">{c.hoursUsed} / {c.hoursIncluded} h</span></div>
              <Progress value={pct} tone={pct >= 90 ? "warn" : "bright"} />
              <p className="mt-3 text-xs text-ink-2">Renouvellement le {shortDate(c.renewal)}</p>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card title="Interventions récentes">
          <ul className="divide-y divide-line">
            {interventions.map((i, k) => (
              <li key={k} className="flex items-center gap-3 py-3 text-sm">
                <span className="w-16 text-xs text-ink-2">{shortDate(i.date)}</span>
                <span className="flex-1 font-semibold">{i.label}</span>
                <span className="text-ink-2">{i.client?.name}</span>
                <span className="w-16 text-right font-semibold">{hours(i.minutes)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={`À facturer en ${new Date().toLocaleDateString("fr-FR", { month: "long" })}`}>
          <ul className="space-y-2 text-sm">
            {contracts.map((c) => <li key={c.id} className="flex justify-between"><span>{clients.find((x) => x.id === c.clientId)?.name}</span><b>{eur(c.monthly)}</b></li>)}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-3 font-bold"><span>Total</span><span>{eur(total)}</span></div>
          <ButtonLink href={INDY_URL} external className="mt-4 w-full">Ouvrir Indy <ExternalLink size={14} /></ButtonLink>
        </Card>
      </div>
    </>
  );
}
