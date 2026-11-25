"use client";
import { useState } from "react";
import { useStack } from "@/lib/store";
import type { App } from "@/lib/types";
import { Button, Field, inputCls } from "./ui";

export function AppForm({ initial, onDone, onDeleted }: { initial?: App; onDone: () => void; onDeleted?: () => void }) {
  const { clients, addApp, updateApp, removeApp } = useStack();
  const [f, setF] = useState({
    name: initial?.name ?? "", url: initial?.url ?? "https://", stack: initial?.stack ?? "Next.js", host: initial?.host ?? "Vercel", clientId: initial?.clientId ?? "",
    status: initial?.status ?? "ok", domainExpiry: initial?.domainExpiry ?? "", sslExpiry: initial?.sslExpiry ?? "", hostingRenewal: initial?.hostingRenewal ?? "", notes: initial?.notes ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (!f.name.trim()) return;
      const data = { ...f, name: f.name.trim(), clientId: f.clientId || undefined, status: f.status as App["status"] };
      if (initial) updateApp(initial.id, data); else addApp(data);
      onDone();
    }}>
      <Field label="Nom"><input className={inputCls} value={f.name} onChange={set("name")} required autoFocus /></Field>
      <Field label="Adresse"><input className={inputCls} value={f.url} onChange={set("url")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Techno"><input className={inputCls} value={f.stack} onChange={set("stack")} /></Field>
        <Field label="Hébergeur"><input className={inputCls} value={f.host} onChange={set("host")} /></Field>
        <Field label="Client">
          <select className={inputCls} value={f.clientId} onChange={set("clientId")}>
            <option value="">Perso</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="État">
          <select className={inputCls} value={f.status} onChange={set("status")}>
            <option value="ok">En ligne</option><option value="warn">Alerte</option><option value="down">Hors ligne</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Fin du domaine"><input type="date" className={inputCls} value={f.domainExpiry} onChange={set("domainExpiry")} /></Field>
        <Field label="Fin du SSL"><input type="date" className={inputCls} value={f.sslExpiry} onChange={set("sslExpiry")} /></Field>
        <Field label="Hébergement"><input type="date" className={inputCls} value={f.hostingRenewal} onChange={set("hostingRenewal")} /></Field>
      </div>
      <Field label="Notes (jamais de mot de passe)"><textarea className={inputCls + " h-20 resize-none"} value={f.notes} onChange={set("notes")} /></Field>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm(`Supprimer ${initial.name} ?`)) { removeApp(initial.id); onDone(); onDeleted?.(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">{initial ? "Enregistrer" : "Ajouter"}</Button>
      </div>
    </form>
  );
}

