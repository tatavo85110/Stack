"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, UploadCloud, Download, Eye, EyeOff } from "lucide-react";
import { useStack } from "@/lib/store";
import type { ContentItem, ContentKind } from "@/lib/types";
import { publishToGitHub, siteJson } from "@/lib/integrations";
import { Button, Card, Empty, Field, Modal, PageHeader, Pill, Segmented, inputCls } from "@/components/ui";
import { shortDate } from "@/lib/format";

const KINDS: { value: ContentKind; label: string; one: string }[] = [
  { value: "projet", label: "Portfolio", one: "projet" },
  { value: "temoignage", label: "Témoignages", one: "témoignage" },
  { value: "article", label: "Articles", one: "article" },
];

function ItemForm({ kind, initial, onDone }: { kind: ContentKind; initial?: ContentItem; onDone: () => void }) {
  const { saveContent, removeContent } = useStack();
  const [f, setF] = useState({ title: initial?.title ?? "", body: initial?.body ?? "", url: initial?.url ?? "", image: initial?.image ?? "", author: initial?.author ?? "", date: initial?.date ?? new Date().toISOString().slice(0, 10), tags: (initial?.tags ?? []).join(", "), published: initial?.published ?? true });
  const t = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return; saveContent({ ...f, id: initial?.id, kind, title: f.title.trim(), tags: f.tags.split(",").map((x) => x.trim()).filter(Boolean) }); onDone(); }}>
      <Field label={kind === "temoignage" ? "Titre (ex. nom de l'entreprise)" : "Titre"}><input className={inputCls} value={f.title} onChange={t("title")} required autoFocus /></Field>
      {kind === "temoignage" && <Field label="Auteur"><input className={inputCls} value={f.author} onChange={t("author")} placeholder="Prénom Nom, fonction" /></Field>}
      <Field label={kind === "temoignage" ? "Témoignage" : kind === "article" ? "Texte (Markdown accepté)" : "Description"}><textarea className={inputCls + " h-40"} value={f.body} onChange={t("body")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        {kind !== "temoignage" && <Field label="Lien"><input className={inputCls} value={f.url} onChange={t("url")} placeholder="https://" /></Field>}
        <Field label="Image (lien)"><input className={inputCls} value={f.image} onChange={t("image")} placeholder="https://" /></Field>
        <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={t("date")} /></Field>
        <Field label="Mots-clés"><input className={inputCls} value={f.tags} onChange={t("tags")} placeholder="Next.js, e-commerce" /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} className="size-4 accent-[var(--bright)]" /> Visible sur le site</label>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm("Supprimer ?")) { removeContent(initial.id); onDone(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">Enregistrer</Button>
      </div>
    </form>
  );
}

export default function Site() {
  const { content, settings, saveContent } = useStack();
  const [kind, setKind] = useState<ContentKind>("projet");
  const [edit, setEdit] = useState<ContentItem | "new" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; link?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const items = content.filter((c) => c.kind === kind);
  const k = KINDS.find((x) => x.value === kind)!;

  const publish = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const link = await publishToGitHub(siteJson(content), settings);
      setMsg({ ok: true, text: "Contenu publié. Ton site se met à jour au prochain déploiement.", link });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([siteJson(content)], { type: "application/json" }));
    a.download = "stack-contenu-site.json";
    a.click();
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Stack", href: "/" }, { label: "Mon site" }]}
        title="Contenu de mon site"
        actions={<><Button onClick={download}><Download size={15} /> JSON</Button><Button variant="primary" onClick={publish} disabled={busy}><UploadCloud size={15} /> {busy ? "Publication…" : "Publier sur le site"}</Button></>}
      />
      <p className="-mt-3 mb-5 text-sm text-ink-2">
        Stack écrit ton contenu dans <code className="rounded bg-muted px-1">{settings.githubPath || "content/stack.json"}</code> du dépôt {settings.githubRepo ? <b>{settings.githubRepo}</b> : <Link className="font-semibold text-bright" href="/reglages">à choisir dans Réglages</Link>}. Ton site lit ce fichier. Les messages du formulaire de contact deviennent des prospects : le code à coller est dans Réglages, rubrique Synchro.
      </p>
      {msg && <p className={`mb-5 rounded-xl p-3 text-sm font-semibold ${msg.ok ? "bg-ok-bg text-ok" : "bg-down-bg text-down"}`}>{msg.text} {msg.link && <a className="underline" href={msg.link} target="_blank" rel="noreferrer">Voir sur GitHub</a>}</p>}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented<ContentKind> value={kind} onChange={setKind} options={KINDS.map(({ value, label }) => ({ value, label: `${label} (${content.filter((c) => c.kind === value).length})` }))} />
        <Button className="ml-auto" onClick={() => setEdit("new")}><Plus size={15} /> Ajouter un {k.one}</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => (
          <Card key={i.id} title={i.title} action={<div className="flex gap-1">
            <button onClick={() => saveContent({ ...i, published: !i.published })} className="rounded-lg p-1.5 text-ink-2 hover:bg-muted" aria-label={i.published ? "Masquer du site" : "Afficher sur le site"}>{i.published ? <Eye size={15} /> : <EyeOff size={15} />}</button>
            <button onClick={() => setEdit(i)} className="rounded-lg p-1.5 text-ink-2 hover:bg-muted hover:text-bright" aria-label={`Modifier ${i.title}`}><Pencil size={15} /></button>
          </div>}>
            {i.image && /^https?:\/\//.test(i.image) && <img src={i.image} alt="" className="mb-3 aspect-video w-full rounded-xl object-cover" />}
            <p className="line-clamp-4 text-sm text-ink-2">{i.body}</p>
            {i.author && <p className="mt-2 text-sm font-semibold">{i.author}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-1.5"><Pill tone={i.published ? "ok" : "neutral"}>{i.published ? "En ligne" : "Brouillon"}</Pill>{i.tags.map((t) => <Pill key={t}>{t}</Pill>)}<span className="ml-auto text-xs text-ink-2">{shortDate(i.date)}</span></div>
          </Card>
        ))}
      </div>
      {!items.length && <Empty>Aucun {k.one} pour l&apos;instant.</Empty>}
      <Modal open={edit !== null} onClose={() => setEdit(null)} title={edit === "new" ? `Nouveau ${k.one}` : "Modifier"}>{edit && <ItemForm kind={kind} initial={edit === "new" ? undefined : edit} onDone={() => setEdit(null)} />}</Modal>
    </>
  );
}
