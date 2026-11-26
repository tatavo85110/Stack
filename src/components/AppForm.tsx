"use client";
import { useRef, useState } from "react";
import { Globe, Upload, X } from "lucide-react";
import { fileToIcon, siteFavicon } from "@/lib/icons";
import { AppIcon } from "./blocks";
import { CategoryPicker } from "./Categories";
import { useStack } from "@/lib/store";
import type { App } from "@/lib/types";
import { Button, Field, inputCls } from "./ui";

export function AppForm({ initial, onDone, onDeleted }: { initial?: App; onDone: () => void; onDeleted?: () => void }) {
  const { clients, addApp, updateApp, removeApp } = useStack();
  const [f, setF] = useState({
    name: initial?.name ?? "", url: initial?.url ?? "https://", stack: initial?.stack ?? "Next.js", host: initial?.host ?? "Vercel", clientId: initial?.clientId ?? "",
    status: initial?.status ?? "ok", domainExpiry: initial?.domainExpiry ?? "", sslExpiry: initial?.sslExpiry ?? "", hostingRenewal: initial?.hostingRenewal ?? "", notes: initial?.notes ?? "",
    sentryOrg: initial?.sentryOrg ?? "", sentryProject: initial?.sentryProject ?? "", deployProvider: initial?.deployProvider ?? "", deployProjectId: initial?.deployProjectId ?? "",
    lastBackup: initial?.lastBackup ?? "", backupEveryDays: String(initial?.backupEveryDays ?? ""), icon: initial?.icon ?? "", category: initial?.category ?? "",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [iconError, setIconError] = useState("");
  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(ico|svg|png|jpe?g|webp)$/i.test(file.name)) return setIconError("Choisis une image (.ico, .png, .svg, .jpg).");
    try { setF((x) => ({ ...x, icon: "" })); const icon = await fileToIcon(file); setF((x) => ({ ...x, icon })); setIconError(""); }
    catch { setIconError("Cette image n'a pas pu être lue. Essaie un .png."); }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (!f.name.trim()) return;
      const data = { ...f, icon: f.icon || undefined, category: f.category || undefined, name: f.name.trim(), clientId: f.clientId || undefined, status: f.status as App["status"], deployProvider: f.deployProvider as App["deployProvider"], backupEveryDays: Number(f.backupEveryDays) || undefined };
      if (initial) updateApp(initial.id, data); else addApp(data);
      onDone();
    }}>
      <Field label="Nom"><input className={inputCls} value={f.name} onChange={set("name")} required autoFocus /></Field>
      <Field label="Adresse"><input className={inputCls} value={f.url} onChange={set("url")} onBlur={() => !f.icon && siteFavicon(f.url) && setF((x) => ({ ...x, icon: siteFavicon(x.url) ?? "" }))} /></Field>
      <CategoryPicker kind="apps" value={f.category} onChange={(category) => setF((x) => ({ ...x, category }))} />
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-ink-2">Favicon</span>
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line-strong p-2.5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
        >
          <AppIcon app={{ name: f.name || "?", icon: f.icon }} size={40} />
          <Button type="button" className="!px-3 !py-2" onClick={() => fileRef.current?.click()}><Upload size={14} /> Importer</Button>
          <Button type="button" className="!px-3 !py-2" disabled={!siteFavicon(f.url)} onClick={() => setF({ ...f, icon: siteFavicon(f.url) ?? "" })}><Globe size={14} /> Celui du site</Button>
          {f.icon && <Button type="button" variant="ghost" className="!px-2 !py-2" aria-label="Retirer le favicon" onClick={() => setF({ ...f, icon: "" })}><X size={14} /></Button>}
          <span className="text-xs text-ink-2">ou glisse un .ico, .png ou .svg ici</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*,.ico" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {iconError && <p className="mt-1 text-xs text-down">{iconError}</p>}
      </div>
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
      <details className="rounded-xl border border-line p-3" open={!!(f.sentryProject || f.deployProvider || f.lastBackup)}>
        <summary className="cursor-pointer text-sm font-semibold">Sentry, déploiements et sauvegardes</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Organisation Sentry"><input className={inputCls} value={f.sentryOrg} onChange={set("sentryOrg")} placeholder="mon-org" /></Field>
          <Field label="Projet Sentry"><input className={inputCls} value={f.sentryProject} onChange={set("sentryProject")} placeholder="mon-site" /></Field>
          <Field label="Déployé avec">
            <select className={inputCls} value={f.deployProvider} onChange={set("deployProvider")}><option value="">Rien</option><option value="vercel">Vercel</option><option value="netlify">Netlify</option><option value="coolify">Coolify</option></select>
          </Field>
          <Field label="Identifiant du projet"><input className={inputCls} value={f.deployProjectId} onChange={set("deployProjectId")} placeholder="prj_… / site id / uuid" /></Field>
          <Field label="Dernière sauvegarde"><input type="date" className={inputCls} value={f.lastBackup} onChange={set("lastBackup")} /></Field>
          <Field label="Sauvegarde tous les (jours)"><input type="number" min="1" className={inputCls} value={f.backupEveryDays} onChange={set("backupEveryDays")} /></Field>
        </div>
      </details>
      <Field label="Notes (jamais de mot de passe)"><textarea className={inputCls + " h-20 resize-none"} value={f.notes} onChange={set("notes")} /></Field>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm(`Supprimer ${initial.name} ?`)) { removeApp(initial.id); onDone(); onDeleted?.(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">{initial ? "Enregistrer" : "Ajouter"}</Button>
      </div>
    </form>
  );
}

