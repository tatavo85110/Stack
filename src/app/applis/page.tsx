"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { useStack } from "@/lib/store";
import { Button, ButtonLink, Card, Field, Kpi, Modal, PageHeader, Segmented, Status, inputCls, Pill } from "@/components/ui";
import { daysUntil, initialsOf, num } from "@/lib/format";
import { deadlines } from "@/lib/stats";

type Filter = "all" | "clients" | "perso";

function AddApp({ onDone }: { onDone: () => void }) {
  const { clients, addApp } = useStack();
  const [f, setF] = useState({ name: "", url: "https://", stack: "Next.js 15", host: "Vercel", clientId: "" });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return; addApp({ ...f, clientId: f.clientId || undefined }); onDone(); }}>
      <Field label="Nom"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <Field label="Adresse"><input className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Techno"><input className={inputCls} value={f.stack} onChange={(e) => setF({ ...f, stack: e.target.value })} /></Field>
        <Field label="Hébergeur"><input className={inputCls} value={f.host} onChange={(e) => setF({ ...f, host: e.target.value })} /></Field>
      </div>
      <Field label="Client">
        <select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
          <option value="">Perso</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="flex justify-end gap-2"><Button type="button" onClick={onDone}>Annuler</Button><Button variant="primary">Ajouter</Button></div>
    </form>
  );
}

export default function Applis() {
  const { apps, clients } = useStack();
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const list = apps.filter((a) => (filter === "all" ? true : filter === "clients" ? a.clientId : !a.clientId));
  const avgUptime = apps.reduce((a, x) => a + x.uptime, 0) / apps.length;
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
        <Kpi tone="night" label="En ligne" value={`${apps.filter((a) => a.status !== "down").length} / ${apps.length}`} />
        <Kpi label="Dispo moyenne 30 j" value={`${num(avgUptime, 2)} %`} />
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
                        <Link href={`/applis/${a.id}`} className="flex items-center gap-3 font-semibold group-hover:text-bright">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-azure text-[11px] font-bold text-azure-text">{initialsOf(a.name)}</span>
                          {a.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-2">{clients.find((c) => c.id === a.clientId)?.name ?? "Perso"}</td>
                      <td className="px-5 py-3 text-ink-2">{a.stack} · {a.host}</td>
                      <td className="px-5 py-3 font-semibold">{num(a.uptime, 2)} %</td>
                      <td className="px-5 py-3">{n !== null ? <Pill tone={n <= 7 ? "down" : n <= 30 ? "warn" : "neutral"}>J-{n}</Pill> : "—"}</td>
                      <td className="px-5 py-3"><Status s={a.status} /></td>
                    </tr>
                  );
                })}
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
              <ButtonLink href={`/applis/${featured.id}`} variant="primary">Ouvrir la fiche</ButtonLink>
              <ButtonLink href={featured.url} external>Ouvrir le site <ExternalLink size={14} /></ButtonLink>
            </div>
          </Card>
        )}
      </div>
      <Modal open={adding} onClose={() => setAdding(false)} title="Nouvelle appli"><AddApp onDone={() => setAdding(false)} /></Modal>
    </>
  );
}
