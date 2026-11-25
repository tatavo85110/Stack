"use client";
import { useState } from "react";
import { useStack } from "@/lib/store";
import { Card, Empty, Kpi, PageHeader, Segmented } from "@/components/ui";
import { Bars, HBars } from "@/components/charts";
import { ProjectsTabs } from "@/components/ProjectsTabs";
import { eur, hours, num } from "@/lib/format";
import { monthlyAverage, revenueByMonth } from "@/lib/stats";

type Range = "30" | "90" | "365";

export default function Activite() {
  const { time, projects, clients, settings } = useStack();
  const [range, setRange] = useState<Range>("30");
  const from = new Date(Date.now() - Number(range) * 86_400_000).toISOString().slice(0, 10);
  const entries = time.filter((t) => t.date >= from);
  const total = entries.reduce((a, t) => a + t.minutes, 0);
  const billable = entries.filter((t) => t.billable).reduce((a, t) => a + t.minutes, 0);
  const clientOf = (projectId: string) => projects.find((p) => p.id === projectId)?.clientId;

  const byClient = new Map<string, number>();
  for (const t of entries) {
    const k = clientOf(t.projectId) ?? "perso";
    byClient.set(k, (byClient.get(k) ?? 0) + t.minutes);
  }
  const perClient = [...byClient.entries()].map(([id, m]) => ({ label: clients.find((c) => c.id === id)?.name ?? "Perso", value: Math.round((m / 60) * 10) / 10 })).sort((a, b) => b.value - a.value);

  const revenueIn = (id: string) => clients.find((c) => c.id === id)?.invoices.filter((i) => i.date >= from).reduce((a, i) => a + i.amount, 0) ?? 0;
  const ratePerClient = [...byClient.entries()].filter(([id, m]) => id !== "perso" && m >= 30).map(([id, m]) => ({ label: clients.find((c) => c.id === id)?.name ?? "?", value: Math.round(revenueIn(id) / (m / 60)) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);

  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(Date.now() - (11 - i) * 7 * 86_400_000);
    const s = new Date(start.getTime() - 6 * 86_400_000).toISOString().slice(0, 10), e = start.toISOString().slice(0, 10);
    return { label: `S${12 - i === 1 ? "" : "-" + (12 - i - 1)}`.replace("S-", "S-"), value: Math.round(time.filter((t) => t.date > s && t.date <= e).reduce((a, t) => a + t.minutes, 0) / 60) };
  });
  const recurring = monthlyAverage(clients);
  const months = revenueByMonth(clients, 12);

  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Projets", href: "/projets" }, { label: "Activité" }]} title="Tableau d'activité" actions={<ProjectsTabs value="activite" />} />
      <div className="mb-5"><Segmented<Range> value={range} onChange={setRange} options={[{ value: "30", label: "30 jours" }, { value: "90", label: "3 mois" }, { value: "365", label: "12 mois" }]} /></div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="night" label="Heures travaillées" value={hours(total)} />
        <Kpi label="Taux facturable" value={total ? `${num((billable / total) * 100)} %` : "—"} hint={`${hours(billable)} facturables`} />
        <Kpi tone="ice" label="Valeur facturable" value={eur((billable / 60) * settings.hourlyRate)} hint={`à ${settings.hourlyRate} €/h`} />
        <Kpi tone="plain" label="CA moyen / mois" value={eur(recurring)} hint="depuis tes imports Indy" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Heures par client">{perClient.length ? <HBars data={perClient} format={(v) => `${num(v, 1)} h`} /> : <Empty>Pas encore de temps sur cette période. Lance le chrono depuis un projet.</Empty>}</Card>
        <Card title="Taux horaire réel par client">{ratePerClient.length ? <HBars data={ratePerClient} format={(v) => `${v} €/h`} /> : <Empty>Il faut du temps et des factures Indy sur la même période.</Empty>}</Card>
        <Card title="Heures par semaine (12 dernières)"><Bars data={weeks.map((w, i) => ({ label: i === 11 ? "Cette" : `S${i - 11}`, value: w.value }))} highlight={11} format={(v) => `${v} h`} /></Card>
        <Card title="Chiffre d'affaires, 12 mois"><Bars data={months} highlight={11} format={(v) => eur(v)} /></Card>
      </div>
    </>
  );
}
