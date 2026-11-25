"use client";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { useStack } from "@/lib/store";
import type { ProjectTemplate } from "@/lib/types";
import { Button, Card, Empty, Field, Modal, PageHeader, Pill, inputCls } from "@/components/ui";
import { ProjectsTabs } from "@/components/ProjectsTabs";

function TemplateForm({ initial, onDone }: { initial?: ProjectTemplate; onDone: () => void }) {
  const { saveTemplate, removeTemplate } = useStack();
  const [f, setF] = useState({ name: initial?.name ?? "", tag: initial?.tag ?? "", days: initial?.days ?? 14, tasks: (initial?.tasks ?? []).join("\n") });
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (!f.name.trim()) return;
      saveTemplate({ id: initial?.id, name: f.name.trim(), tag: f.tag.trim() || "Projet", days: Number(f.days) || 14, tasks: f.tasks.split("\n").map((t) => t.trim()).filter(Boolean) });
      onDone();
    }}>
      <Field label="Nom du modèle"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Étiquette"><input className={inputCls} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} /></Field>
        <Field label="Durée prévue (jours)"><input type="number" min="1" className={inputCls} value={f.days} onChange={(e) => setF({ ...f, days: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Étapes (une par ligne)"><textarea className={inputCls + " h-44"} value={f.tasks} onChange={(e) => setF({ ...f, tasks: e.target.value })} /></Field>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm(`Supprimer le modèle « ${initial.name} » ?`)) { removeTemplate(initial.id); onDone(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">Enregistrer</Button>
      </div>
    </form>
  );
}

export default function Modeles() {
  const templates = useStack((s) => s.templates);
  const [edit, setEdit] = useState<ProjectTemplate | "new" | null>(null);
  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Projets", href: "/projets" }, { label: "Modèles" }]} title="Modèles de projet" actions={<><ProjectsTabs value="modeles" /><Button variant="primary" onClick={() => setEdit("new")}><Plus size={16} /> Nouveau modèle</Button></>} />
      <p className="-mt-3 mb-5 text-sm text-ink-2">Choisis un modèle quand tu crées un projet : les étapes, l&apos;étiquette et l&apos;échéance sont remplies pour toi. Les modèles de contrat restent dans Indy.</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} title={t.name} action={<button onClick={() => setEdit(t)} className="rounded-lg p-1.5 text-ink-2 hover:bg-muted hover:text-bright" aria-label={`Modifier ${t.name}`}><Pencil size={15} /></button>}>
            <div className="mb-3 flex gap-2"><Pill tone="info">{t.tag}</Pill><Pill>{t.days} jours</Pill></div>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">{t.tasks.map((x, i) => <li key={i}>{x}</li>)}</ol>
          </Card>
        ))}
      </div>
      {!templates.length && <Empty>Aucun modèle. Crée le premier.</Empty>}
      <Modal open={edit !== null} onClose={() => setEdit(null)} title={edit === "new" ? "Nouveau modèle" : "Modifier le modèle"}>{edit && <TemplateForm initial={edit === "new" ? undefined : edit} onDone={() => setEdit(null)} />}</Modal>
    </>
  );
}
