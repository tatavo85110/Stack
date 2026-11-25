"use client";
import { useState } from "react";
import { useStack } from "@/lib/store";
import { Button, Field, inputCls } from "./ui";

export function RequestForm({ clientId, onDone }: { clientId?: string; onDone: () => void }) {
  const { clients, addRequest } = useStack();
  const [f, setF] = useState({ clientId: clientId ?? clients[0]?.id ?? "", text: "" });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.text.trim()) return; addRequest({ clientId: f.clientId || undefined, from: clients.find((c) => c.id === f.clientId)?.name ?? "Moi", date: new Date().toISOString().slice(0, 10), text: f.text.trim(), status: "Nouvelle" }); onDone(); }}>
      <Field label="Client"><select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}><option value="">Aucun</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Demande"><textarea className={inputCls + " h-32"} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} autoFocus required /></Field>
      <div className="flex justify-end gap-2"><Button type="button" onClick={onDone}>Annuler</Button><Button variant="primary">Ajouter</Button></div>
    </form>
  );
}

