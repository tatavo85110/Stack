"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { useStack } from "@/lib/store";
import { Button, ButtonLink, Card, Empty, Kpi, Modal, PageHeader, Segmented, Status, Pill } from "@/components/ui";
import { AppForm } from "@/components/AppForm";
import { daysUntil, initialsOf, num } from "@/lib/format";
import { deadlines } from "@/lib/stats";

type Filter = "all" | "clients" | "perso";

export default function Page() {
  return <Suspense><Applis /></Suspense>;
}

function Applis() {
  const { apps, clients } = useStack();
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const params = useSearchParams();
  useEffect(() => { if (params.get("ajout")) setAdding(true); }, [params]);
  const list = apps.filter((a) => (filter === "all" ? true : filter === "clients" ? a.clientId : !a.clientId));
  const measured = apps.filter((a) => a.uptime >= 0);
  const avgUptime = measured.length ? measured.reduce((a, x) => a + x.uptime, 0) / measured.length : null;
  const soon = deadlines(apps, 30).length;
  const featured = apps.find((a) => a.status === "down") ?? apps[0];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Stack", href: "/" }, { label: "Applis" }]}
        title="Applis"
        actions={
          <>
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Toutes · ${apps.length}` },
                { value: "clients", label: `Clients · ${apps.filter((a) => a.clientId).length}` },
                { value: "perso", label: `Perso · ${apps.filter((a) => !a.clientId).length}` },
              ]}
            />
            <Button variant="primary" onClick={() => setAdding(true)}><Plus size={16} /> Ajouter une appli</Button>
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="night" label="En ligne" value={apps.length ? `${apps.filter((a) => a.status !== "down").length} / ${apps.length}` : "—"} />
        <Kpi label="Dispo moyenne 30 j" value={avgUptime === null ? "—" : `${num(avgUptime, 2)} %`} />
        <Kpi tone="ice" label="Échéances sous 30 j" value={soon} />
        <Kpi tone="plain" label="Erreurs sur 7 j" value={apps.reduce((a, x) => a + x.errors7d, 0)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-2">
                  {["Appli", "Client", "Techno", "Dispo 30 j", "Prochaine échéance", "État"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const next = [a.domainExpiry, a.sslExpiry, a.hostingRenewal].filter(Boolean).sort()[0];
                  const n = next ? daysUntil(next) : null;
                  return (
                    <tr key={a.id} className="group border-b border-line/60 last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/applis/fiche?id=${a.id}`} className="flex items-center gap-3 font-semibold group-hover:text-bright">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-azure text-[11px] font-bold text-azure-text">{initialsOf(a.name)}</span>
                          {a.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-2">{clients.find((c) => c.id === a.clientId)?.name ?? "Perso"}</td>
                      <td className="px-5 py-3 text-ink-2">{a.stack} · {a.host}</td>
                      <td className="px-5 py-3 font-semibold">{a.uptime >= 0 ? `${num(a.uptime, 2)} %` : "—"}</td>
                      <td className="px-5 py-3">{n !== null ? <Pill tone={n <= 7 ? "down" : n <= 30 ? "warn" : "neutral"}>J-{n}</Pill> : "—"}</td>
                      <td className="px-5 py-3"><Status s={a.status} /></td>
                    </tr>
                  );
                })}
                {!list.length && <tr><td colSpan={6} className="p-5"><Empty>Aucune appli pour l&apos;instant. <button className="font-semibold text-bright" onClick={() => setAdding(true)}>Ajouter une appli</button></Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        {featured && (
          <Card title={featured.name}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-ink-2">État</span><Status s={featured.status} /></div>
              <div className="flex items-center justify-between"><span className="text-ink-2">Client</span><span className="font-semibold">{clients.find((c) => c.id === featured.clientId)?.name ?? "Perso"}</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-2">Temps de réponse</span><span className="font-semibold">{featured.responseMs ? `${featured.responseMs} ms` : "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-2">Erreurs 7 j</span><span className="font-semibold">{featured.errors7d}</span></div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <ButtonLink href={`/applis/fiche?id=${featured.id}`} variant="primary">Ouvrir la fiche</ButtonLink>
              <ButtonLink href={featured.url} external>Ouvrir le site <ExternalLink size={14} /></ButtonLink>
            </div>
          </Card>
        )}
      </div>
      <Modal open={adding} onClose={() => setAdding(false)} title="Nouvelle appli"><AppForm onDone={() => setAdding(false)} /></Modal>
    </>
  );
}
