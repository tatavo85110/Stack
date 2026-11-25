"use client";
import { useState } from "react";
import { RequestForm } from "@/components/RequestForm";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useStack } from "@/lib/store";
import type { ClientRequest } from "@/lib/types";
import { Button, Card, Empty, Field, Modal, PageHeader, Pill, Segmented, inputCls } from "@/components/ui";
import { shortDate } from "@/lib/format";

const STATUSES: ClientRequest["status"][] = ["Nouvelle", "En cours", "Faite"];

export default function Demandes() {
  const { requests, clients, updateRequest, removeRequest } = useStack();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [adding, setAdding] = useState(false);
  const list = requests.filter((r) => filter === "all" || r.status !== "Faite");
  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Clients", href: "/clients" }, { label: "Demandes" }]} title="Demandes clients" actions={<Button variant="primary" onClick={() => setAdding(true)}><Plus size={16} /> Nouvelle demande</Button>} />
      <p className="-mt-3 mb-5 text-sm text-ink-2">Les demandes envoyées depuis le portail client arrivent ici quand la synchro est active. Sinon, elles t&apos;arrivent par email et tu peux les ajouter à la main.</p>
      <div className="mb-4"><Segmented value={filter} onChange={setFilter} options={[{ value: "open", label: "À traiter" }, { value: "all", label: "Toutes" }]} /></div>
      <Card>
        <ul className="divide-y divide-line">
          {list.map((r) => {
            const c = clients.find((x) => x.id === r.clientId);
            return (
              <li key={r.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-2">{c ? <Link className="font-semibold text-bright" href={`/clients/fiche?id=${c.id}`}>{c.name}</Link> : r.from} · {shortDate(r.date)}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{r.text}</p>
                </div>
                <select value={r.status} onChange={(e) => updateRequest(r.id, { status: e.target.value as ClientRequest["status"] })} className={inputCls + " w-auto py-1.5 text-xs font-semibold"} aria-label="Statut">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                <Pill tone={r.status === "Nouvelle" ? "warn" : r.status === "En cours" ? "info" : "ok"}>{r.status}</Pill>
                <button onClick={() => confirm("Supprimer cette demande ?") && removeRequest(r.id)} className="rounded-lg p-1.5 text-ink-2 hover:text-down" aria-label="Supprimer"><Trash2 size={15} /></button>
              </li>
            );
          })}
        </ul>
        {!list.length && <Empty>Aucune demande à traiter.</Empty>}
      </Card>
      <Modal open={adding} onClose={() => setAdding(false)} title="Nouvelle demande">{adding && <RequestForm onDone={() => setAdding(false)} />}</Modal>
    </>
  );
}
