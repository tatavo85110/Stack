"use client";
import { useStack } from "@/lib/store";
import { Card, Kpi, PageHeader, Segmented } from "@/components/ui";
import { Bars, Donut, HBars } from "@/components/charts";
import { IndyImportButton } from "@/components/IndyImport";
import { eur, num } from "@/lib/format";
import { averageBasket, clientTotal, conversionRate, loyalty, realHourlyRate, monthlyAverage, revenueByMonth, revenueYear, signatureDelay, sources } from "@/lib/stats";

export default function Stats() {
  const { clients, time } = useStack();
  const months = revenueByMonth(clients, 12);
  const byClient = clients.map((c) => ({ label: c.name, value: clientTotal(c) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const rate = realHourlyRate(clients, time);
  const loyal = loyalty(clients);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Stack", href: "/" }, { label: "Clients", href: "/clients" }, { label: "Stats" }]}
        title="Statistiques"
        actions={<>
          <Segmented value="stats" options={[{ value: "liste", label: "Liste", href: "/clients" }, { value: "stats", label: "Stats" }]} />
          <IndyImportButton />
          <button onClick={() => window.print()} className="rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:border-bright">Exporter PDF</button>
        </>}
      />
      <p className="-mt-3 mb-5 text-sm text-ink-2">Le chiffre d&apos;affaires vient de tes exports Indy, sans connexion bancaire. Les heures viennent du suivi du temps.</p>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi tone="night" label={`1 · CA ${new Date().getFullYear()}`} value={eur(revenueYear(clients))} />
        <Kpi label="2 · CA moyen / mois" value={eur(monthlyAverage(clients))} hint="Sur les 12 derniers mois" />
        <Kpi tone="ice" label="3 · Panier moyen" value={eur(averageBasket(clients))} hint="Projets de plus de 500 €" />
        <Kpi tone="plain" label="4 · Taux de conversion" value={`${num(conversionRate(clients))} %`} />
        <Kpi tone="plain" label="5 · Délai moyen de signature" value={`${num(signatureDelay(clients))} j`} />
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card title="6 · Évolution du CA, 12 mois"><Bars data={months} highlight={11} format={eur} height={220} /></Card>
        <Card title="7 · CA par client">{byClient.length ? <HBars data={byClient} format={eur} /> : <p className="text-sm text-ink-2">Importe un export Indy pour voir ton CA par client.</p>}</Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="8 · Sources d'acquisition">{clients.length ? <Donut data={sources(clients)} /> : <p className="text-sm text-ink-2">Ajoute des clients pour voir d&apos;où ils viennent.</p>}</Card>
        <Card title="9 · Fidélité">
          <p className="text-4xl font-extrabold tracking-tight">{num(loyal)} %</p>
          <p className="mt-1 text-sm text-ink-2">des clients payants ont été facturés plusieurs fois.</p>
          <div className="mt-5 h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-bright" style={{ width: `${loyal}%` }} /></div>
        </Card>
        <Card title="10 · Taux horaire réel">
          <p className="text-4xl font-extrabold tracking-tight">{rate ? `${eur(rate)} / h` : "—"}</p>
          <p className="mt-1 text-sm text-ink-2">CA des 30 derniers jours divisé par les heures facturables de la même période.</p>
        </Card>
      </div>
    </>
  );
}
