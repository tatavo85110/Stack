"use client";
import { useState } from "react";
import { useStack } from "@/lib/store";
import type { Client, Stage } from "@/lib/types";
import { Button, Field, inputCls } from "./ui";

export const STAGES: Stage[] = ["Prospect", "Devis envoyé", "Signé", "Actif", "Perdu"];
const SOURCES: Client["source"][] = ["Bouche-à-oreille", "Site web", "LinkedIn", "Malt", "Réseau"];

export function ClientForm({ initial, onDone, onDeleted }: { initial?: Client; onDone: () => void; onDeleted?: () => void }) {
  const { addClient, updateClient, removeClient } = useStack();
  const [f, setF] = useState({
    name: initial?.name ?? "", contact: initial?.contact ?? "", email: initial?.email ?? "", phone: initial?.phone ?? "", email2: initial?.email2 ?? "", phone2: initial?.phone2 ?? "", sector: initial?.sector ?? "",
    source: initial?.source ?? ("Bouche-à-oreille" as Client["source"]), stage: initial?.stage ?? ("Prospect" as Stage), quoteAmount: initial?.quoteAmount ? String(initial.quoteAmount) : "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (!f.name.trim()) return;
      const data = { ...f, name: f.name.trim(), quoteAmount: f.quoteAmount ? Number(f.quoteAmount) : undefined };
      if (initial) updateClient(initial.id, data); else addClient(data);
      onDone();
    }}>
      <Field label="Client (entreprise ou particulier)"><input className={inputCls} value={f.name} onChange={set("name")} required autoFocus placeholder="Ex. Boulangerie Dupont, ou Marie et Paul Martin" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Personne à contacter" hint="Ton interlocuteur, si le client est une entreprise. Facultatif."><input className={inputCls} value={f.contact} onChange={set("contact")} placeholder="Ex. Claire Dupont" /></Field>
        <Field label="Secteur"><input className={inputCls} value={f.sector} onChange={set("sector")} placeholder="Ex. Restauration" /></Field>
        <Field label="E-mail"><input type="email" className={inputCls} value={f.email} onChange={set("email")} /></Field>
        <Field label="2e e-mail (facultatif)"><input type="email" className={inputCls} value={f.email2} onChange={set("email2")} /></Field>
        <Field label="Téléphone"><input type="tel" className={inputCls} value={f.phone} onChange={set("phone")} /></Field>
        <Field label="2e téléphone (facultatif)"><input type="tel" className={inputCls} value={f.phone2} onChange={set("phone2")} /></Field>
        <Field label="Origine"><select className={inputCls} value={f.source} onChange={set("source")}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Étape"><select className={inputCls} value={f.stage} onChange={set("stage")}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Montant du devis en cours (€)"><input type="number" min="0" className={inputCls} value={f.quoteAmount} onChange={set("quoteAmount")} /></Field>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm(`Supprimer ${initial.name} ?`)) { removeClient(initial.id); onDone(); onDeleted?.(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">{initial ? "Enregistrer" : "Créer le client"}</Button>
      </div>
    </form>
  );
}
