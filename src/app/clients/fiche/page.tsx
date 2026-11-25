"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ClientForm } from "@/components/ClientForm";
import Link from "next/link";
import { Mail, Phone, ExternalLink, Check, Pencil, Plus } from "lucide-react";
import { useStack } from "@/lib/store";
import type { Stage } from "@/lib/types";
import { Avatar, Button, ButtonLink, Card, Empty, Kpi, Modal, PageHeader, Pill, inputCls } from "@/components/ui";
import { isoIn } from "@/lib/format";
import { AppRow } from "@/components/blocks";
import { eur, initialsOf, shortDate, INDY_URL } from "@/lib/format";
import { clientTotal } from "@/lib/stats";

const STAGES: Stage[] = ["Prospect", "Devis envoyé", "Signé", "Actif", "Perdu"];

export default function Page() {
  return <Suspense><ClientPage /></Suspense>;
}

function ClientPage() {
  const id = useSearchParams().get("id") ?? "";
  const { clients, apps, setClientStage, completeNextAction, updateClient, addHistory } = useStack();
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [action, setAction] = useState({ label: "", date: isoIn(2) });
  const [noteText, setNoteText] = useState("");
  const c = clients.find((x) => x.id === id);
  if (!c) return <Empty>Ce client n&apos;existe pas. <Link className="text-bright" href="/clients">Retour aux clients</Link></Empty>;
  const since12 = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const paid = c.invoices.length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Stack", href: "/" }, { label: "Clients", href: "/clients" }, { label: c.name }]}
        title={c.name}
        actions={
          <>
            <Button onClick={() => setEdit(true)}><Pencil size={15} /> Modifier</Button>
            {c.email && <ButtonLink href={`mailto:${c.email}`} external><Mail size={15} /> Écrire un e-mail</ButtonLink>}
            <ButtonLink href={INDY_URL} external variant="primary">Nouveau devis dans Indy <ExternalLink size={14} /></ButtonLink>
          </>
        }
      />
      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-2">
        <select value={c.stage} onChange={(e) => setClientStage(c.id, e.target.value as Stage)} className={inputCls + " w-auto py-1.5 text-xs font-semibold"} aria-label="Étape">
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {c.sector && <Pill>{c.sector}</Pill>}
        <Pill>Client depuis {new Date(c.since).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</Pill>
        <Pill tone="info">{c.source}</Pill>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="night" label="CA total" value={eur(clientTotal(c))} hint={`${paid} facture${paid > 1 ? "s" : ""}`} />
        <Kpi label="CA 12 mois" value={eur(c.invoices.filter((i) => i.date >= since12).reduce((a, i) => a + i.amount, 0))} />
        <Kpi tone="ice" label="Dernière facture" value={c.invoices.length ? shortDate([...c.invoices].sort((a, b) => b.date.localeCompare(a.date))[0].date) : "—"} />
        <Kpi tone="plain" label="Devis en cours" value={c.quoteAmount && c.stage !== "Actif" ? eur(c.quoteAmount) : "—"} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Contact">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar text={initialsOf(c.contact || c.name)} className="size-12 text-sm" />
              <div className="flex-1">
                <p className="font-bold">{c.contact || "—"}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                  {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-bright"><Mail size={14} />{c.email}</a>}
                  {c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-bright"><Phone size={14} />{c.phone}</a>}
                </div>
              </div>
            </div>
          </Card>
          <Card title="Applis du client">
            <div className="-m-2.5">{apps.filter((a) => a.clientId === c.id).map((a) => <AppRow key={a.id} app={a} />)}</div>
            {!apps.some((a) => a.clientId === c.id) && <Empty>Aucune appli pour ce client.</Empty>}
          </Card>
          <Card title="Historique">
            <form className="mb-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (noteText.trim()) { addHistory(c.id, noteText.trim()); setNoteText(""); } }}>
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ajouter une note (appel, rendez-vous…)" className={inputCls} />
              <Button variant="primary" aria-label="Ajouter la note"><Plus size={16} /></Button>
            </form>
            <ol className="relative space-y-4 border-l-2 border-line pl-5">
              {c.history.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1 -left-[27px] size-3 rounded-full border-2 border-surface bg-bright" />
                  <p className="text-sm font-semibold">{h.label}</p>
                  <p className="text-xs text-ink-2">{shortDate(h.date)}</p>
                </li>
              ))}
              {!c.history.length && <p className="text-sm text-ink-2">Rien pour l&apos;instant.</p>}
            </ol>
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Prochaine action" className={c.nextAction ? "border-bright" : ""}>
            {c.nextAction ? (
              <>
                <p className="font-semibold">{c.nextAction.label}</p>
                <p className="text-sm text-ink-2">le {shortDate(c.nextAction.date)}</p>
                <Button variant="primary" className="mt-4 w-full" onClick={() => completeNextAction(c.id)}><Check size={16} /> Marquer comme fait</Button>
              </>
            ) : (
              <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (action.label.trim()) { updateClient(c.id, { nextAction: { label: action.label.trim(), date: action.date } }); setAction({ label: "", date: isoIn(2) }); } }}>
                <input value={action.label} onChange={(e) => setAction({ ...action, label: e.target.value })} placeholder="Ex. Relancer le devis" className={inputCls} />
                <input type="date" value={action.date} onChange={(e) => setAction({ ...action, date: e.target.value })} className={inputCls} />
                <Button variant="primary" className="w-full">Planifier</Button>
              </form>
            )}
          </Card>
          <Card title="Factures (depuis Indy)">
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {[...c.invoices].sort((a, b) => b.date.localeCompare(a.date)).map((i, k) => (
                <li key={k} className="flex justify-between text-sm"><span className="text-ink-2">{shortDate(i.date)}</span><b>{eur(i.amount)}</b></li>
              ))}
              {!c.invoices.length && <p className="text-sm text-ink-2">Aucune facture importée.</p>}
            </ul>
          </Card>
        </div>
      </div>
      <Modal open={edit} onClose={() => setEdit(false)} title="Modifier le client"><ClientForm initial={c} onDone={() => setEdit(false)} onDeleted={() => router.push("/clients")} /></Modal>
    </>
  );
}
