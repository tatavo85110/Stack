"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClientForm, STAGES } from "@/components/ClientForm";
import Link from "next/link";
import { Plus, Search, Download } from "lucide-react";
import { useStack } from "@/lib/store";
import type { Stage } from "@/lib/types";
import { Avatar, Button, Card, Empty, Kpi, Modal, PageHeader, Pill, Segmented, inputCls } from "@/components/ui";
import { Bars } from "@/components/charts";
import { IndyImportButton } from "@/components/IndyImport";
import { eur, initialsOf, num, shortDate } from "@/lib/format";
import { averageBasket, clientTotal, conversionRate, monthlyAverage, revenueByMonth } from "@/lib/stats";

const stageTone = (s: Stage) => (s === "Actif" ? "ok" : s === "Signé" ? "info" : s === "Perdu" ? "down" : s === "Devis envoyé" ? "warn" : "neutral") as "ok";

export default function Page() {
  return <Suspense><Clients /></Suspense>;
}

function Clients() {
  const { clients, setClientStage } = useStack();
  const [view, setView] = useState<"liste" | "pipeline">("liste");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<"" | Stage>("");
  const [adding, setAdding] = useState(false);
  const params = useSearchParams();
  useEffect(() => { if (params.get("ajout")) setAdding(true); }, [params]);
  const [drag, setDrag] = useState<string | null>(null);
  const list = clients.filter((c) => (!stage || c.stage === stage) && (c.name + c.contact + c.sector).toLowerCase().includes(q.toLowerCase()));
  const months = revenueByMonth(clients, 12);

  const exportCsv = () => {
    const rows = [["Client", "Contact", "E-mail", "2e e-mail", "Téléphone", "2e téléphone", "Étape", "CA total"], ...clients.map((c) => [c.name, c.contact, c.email, c.email2 ?? "", c.phone, c.phone2 ?? "", c.stage, String(clientTotal(c))])];
    const blob = new Blob(["﻿" + rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(";")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clients-stack.csv";
    a.click();
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Stack", href: "/" }, { label: "Clients" }]}
        title="Clients"
        actions={
          <>
            <Segmented value={view} onChange={setView} options={[{ value: "liste", label: "Liste" }, { value: "pipeline", label: "Pipeline" }, { value: "stats" as "liste", label: "Stats", href: "/clients/stats" }]} />
            <IndyImportButton />
            <Button onClick={exportCsv}><Download size={16} /> Exporter CSV</Button>
            <Button variant="primary" onClick={() => setAdding(true)}><Plus size={16} /> Nouveau client</Button>
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="night" label="Clients actifs" value={clients.filter((c) => c.stage === "Actif" || c.stage === "Signé").length} />
        <Kpi label="Panier moyen" value={eur(averageBasket(clients))} />
        <Kpi tone="ice" label="Taux de conversion" value={`${num(conversionRate(clients))} %`} />
        <Kpi tone="plain" label="CA moyen / mois" value={eur(monthlyAverage(clients))} />
      </div>

      {view === "liste" ? (
        <>
          <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <Card title={`CA par mois · ${new Date().getFullYear()}`}><Bars data={months} highlight={11} format={eur} height={170} /></Card>
            <Card title="Pipeline">
              <ul className="space-y-2.5">
                {STAGES.slice(0, 4).map((s) => {
                  const n = clients.filter((c) => c.stage === s);
                  const amount = n.reduce((a, c) => a + (c.quoteAmount ?? 0), 0);
                  return (
                    <li key={s} className="flex items-center justify-between text-sm">
                      <Pill tone={stageTone(s)}>{s}</Pill>
                      <span className="font-semibold">{n.length}{amount ? ` · ${eur(amount)}` : ""}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap gap-2 border-b border-line p-4">
              <label className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong px-3 focus-within:border-bright">
                <Search size={16} className="text-ink-2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client" className="w-full bg-transparent py-2.5 text-sm outline-none" />
              </label>
              <select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className={inputCls + " w-auto"}>
                <option value="">Toutes les étapes</option>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-line text-left text-xs text-ink-2">{["Client", "Étape", "Secteur", "CA total", "Prochaine action"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="group border-b border-line/60 transition-colors last:border-0 hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <Link href={`/clients/fiche?id=${c.id}`} className="flex items-center gap-3">
                          <Avatar text={initialsOf(c.name)} />
                          <span><span className="block font-semibold group-hover:text-bright">{c.name}</span><span className="text-xs text-ink-2">{c.contact}</span></span>
                        </Link>
                      </td>
                      <td className="px-5 py-3"><Pill tone={stageTone(c.stage)}>{c.stage}</Pill></td>
                      <td className="px-5 py-3 text-ink-2">{c.sector || "—"}</td>
                      <td className="px-5 py-3 font-semibold">{eur(clientTotal(c))}</td>
                      <td className="px-5 py-3 text-ink-2">{c.nextAction ? `${c.nextAction.label} · ${shortDate(c.nextAction.date)}` : "—"}</td>
                    </tr>
                  ))}
                  {!list.length && <tr><td colSpan={5} className="p-5"><Empty>{clients.length ? "Aucun client ne correspond." : <>Aucun client pour l&apos;instant. <button className="font-semibold text-bright" onClick={() => setAdding(true)}>Créer un client</button> ou importe un export Indy.</>}</Empty></td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <div className="grid gap-4 overflow-x-auto md:grid-cols-5">
          {STAGES.map((s) => (
            <div key={s} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) setClientStage(drag, s); setDrag(null); }} className="min-h-60 min-w-56 rounded-2xl bg-muted p-3">
              <p className="mb-3 flex items-center justify-between px-1 text-sm font-bold">{s}<span className="text-ink-2">{clients.filter((c) => c.stage === s).length}</span></p>
              <div className="space-y-2">
                {clients.filter((c) => c.stage === s).map((c) => (
                  <Link key={c.id} href={`/clients/fiche?id=${c.id}`} draggable onDragStart={() => setDrag(c.id)} className="block cursor-grab rounded-xl border border-line bg-surface p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-ink-2">{c.quoteAmount ? eur(c.quoteAmount) : c.sector}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Nouveau client"><ClientForm onDone={() => setAdding(false)} /></Modal>
    </>
  );
}
