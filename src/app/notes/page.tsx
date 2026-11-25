"use client";
import { useMemo, useState } from "react";
import { Plus, Pencil, Search, Sparkles } from "lucide-react";
import { useStack } from "@/lib/store";
import type { TechNote } from "@/lib/types";
import { askClaude } from "@/lib/ai";
import { Button, Card, Empty, Field, Modal, PageHeader, Pill, inputCls } from "@/components/ui";
import { shortDate } from "@/lib/format";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function NoteForm({ initial, onDone }: { initial?: TechNote; onDone: () => void }) {
  const { apps, saveNote, removeNote } = useStack();
  const [f, setF] = useState({ title: initial?.title ?? "", body: initial?.body ?? "", tags: (initial?.tags ?? []).join(", "), appId: initial?.appId ?? "" });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return; saveNote({ id: initial?.id, title: f.title.trim(), body: f.body, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), appId: f.appId || undefined }); onDone(); }}>
      <Field label="Titre"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required autoFocus /></Field>
      <Field label="Contenu (jamais de mot de passe)"><textarea className={inputCls + " h-56 font-mono text-xs"} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mots-clés (séparés par des virgules)"><input className={inputCls} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></Field>
        <Field label="Appli liée">
          <select className={inputCls} value={f.appId} onChange={(e) => setF({ ...f, appId: e.target.value })}><option value="">Aucune</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </Field>
      </div>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm("Supprimer cette note ?")) { removeNote(initial.id); onDone(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">Enregistrer</Button>
      </div>
    </form>
  );
}

export default function Notes() {
  const { techNotes, apps } = useStack();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<TechNote | "new" | null>(null);
  const [ai, setAi] = useState<{ busy: boolean; ids: string[] | null; why: string; error: string }>({ busy: false, ids: null, why: "", error: "" });

  const list = useMemo(() => {
    if (ai.ids) return ai.ids.map((id) => techNotes.find((n) => n.id === id)).filter(Boolean) as TechNote[];
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return techNotes;
    return techNotes
      .map((n) => ({ n, score: words.reduce((s, w) => s + (norm(n.title).includes(w) ? 3 : 0) + (n.tags.some((t) => norm(t).includes(w)) ? 2 : 0) + (norm(n.body).includes(w) ? 1 : 0), 0) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.n);
  }, [q, techNotes, ai.ids]);

  const semantic = async () => {
    if (!q.trim()) return;
    setAi({ busy: true, ids: null, why: "", error: "" });
    try {
      const corpus = techNotes.map((n) => `[${n.id}] ${n.title} (${n.tags.join(", ")})\n${n.body.slice(0, 1500)}`).join("\n\n---\n\n");
      const out = await askClaude(
        `Voici mes notes techniques, chacune précédée de son identifiant entre crochets.\n\n${corpus}\n\nQuestion : « ${q} »\n\nTrouve les notes qui répondent à la question, même si les mots sont différents. Réponds sur la première ligne avec les identifiants pertinents, du plus utile au moins utile, séparés par des virgules (ou AUCUNE). Puis, à la ligne, une ou deux phrases qui répondent directement à la question à partir des notes.`,
        { effort: "low" },
      );
      const [first, ...rest] = out.split("\n");
      const ids = first.replace(/[[\]\s]/g, "").split(",").filter((id) => techNotes.some((n) => n.id === id));
      setAi({ busy: false, ids, why: rest.join("\n").trim(), error: "" });
    } catch (e) {
      setAi({ busy: false, ids: null, why: "", error: e instanceof Error ? e.message : "Erreur" });
    }
  };

  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Notes techniques" }]} title="Notes techniques" actions={<Button variant="primary" onClick={() => setEdit("new")}><Plus size={16} /> Nouvelle note</Button>} />
      <form className="mb-5 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); semantic(); }}>
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute top-3 left-3 text-ink-2" />
          <input className={inputCls + " pl-9"} placeholder="Chercher dans tes notes (ex. comment je déploie sur o2switch ?)" value={q} onChange={(e) => { setQ(e.target.value); setAi({ busy: false, ids: null, why: "", error: "" }); }} />
        </div>
        <Button disabled={ai.busy || !q.trim() || !techNotes.length}><Sparkles size={15} /> {ai.busy ? "Recherche…" : "Recherche intelligente"}</Button>
      </form>
      {ai.why && <p className="mb-4 rounded-xl bg-azure p-3 text-sm text-azure-text">{ai.why}</p>}
      {ai.error && <p className="mb-4 rounded-xl bg-down-bg p-3 text-sm text-down">{ai.error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((n) => (
          <Card key={n.id} title={n.title} action={<button onClick={() => setEdit(n)} className="rounded-lg p-1.5 text-ink-2 hover:bg-muted hover:text-bright" aria-label={`Modifier ${n.title}`}><Pencil size={15} /></button>}>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {n.appId && <Pill tone="info">{apps.find((a) => a.id === n.appId)?.name ?? "Appli"}</Pill>}
              {n.tags.map((t) => <Pill key={t}>{t}</Pill>)}
            </div>
            <p className="line-clamp-6 text-sm whitespace-pre-wrap text-ink-2">{n.body}</p>
            <p className="mt-3 text-xs text-ink-2">Modifiée le {shortDate(n.date)}</p>
          </Card>
        ))}
      </div>
      {!list.length && <Empty>{techNotes.length ? "Aucune note ne correspond. Essaie la recherche intelligente." : "Aucune note. Garde ici tes procédures, commandes et astuces (jamais de mot de passe)."}</Empty>}
      <Modal open={edit !== null} onClose={() => setEdit(null)} title={edit === "new" ? "Nouvelle note" : "Modifier la note"}>{edit && <NoteForm initial={edit === "new" ? undefined : edit} onDone={() => setEdit(null)} />}</Modal>
    </>
  );
}
