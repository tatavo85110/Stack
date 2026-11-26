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
    name: initial?.name ?? "", url: initial?.url ?? "https://", stack: initial?.stack ?? "", host: initial?.host ?? "", clientId: initial?.clientId ?? "",
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
      <p className="text-xs font-bold tracking-wide text-ink-2 uppercase">L&apos;essentiel</p>
      <Field label="Nom"><input className={inputCls} value={f.name} onChange={set("name")} required autoFocus placeholder="Ex. Site de la boulangerie Dupont" /></Field>
      <Field label="Adresse du site" hint="Stack vérifie régulièrement que cette adresse répond et te prévient si le site tombe.">
        <input className={inputCls} value={f.url} onChange={set("url")} onBlur={() => !f.icon && siteFavicon(f.url) && setF((x) => ({ ...x, icon: siteFavicon(x.url) ?? "" }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <CategoryPicker kind="apps" value={f.category} onChange={(category) => setF((x) => ({ ...x, category }))} />
        <Field label="Pour qui ?">
          <select className={inputCls} value={f.clientId} onChange={set("clientId")}>
            <option value="">Moi (perso)</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>
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

      <details className="rounded-xl border border-line p-3" open={!!(f.stack || f.host)}>
        <summary className="cursor-pointer text-sm font-semibold">Technique <span className="font-normal text-ink-2">(facultatif)</span></summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Fait avec" hint="La techno du site."><input className={inputCls} value={f.stack} onChange={set("stack")} placeholder="Ex. WordPress, Next.js" /></Field>
          <Field label="Hébergé chez" hint="Là où le site tourne."><input className={inputCls} value={f.host} onChange={set("host")} placeholder="Ex. OVH, Vercel, o2switch" /></Field>
        </div>
      </details>
      <details className="rounded-xl border border-line p-3" open={!!(f.domainExpiry || f.sslExpiry || f.hostingRenewal)}>
        <summary className="cursor-pointer text-sm font-semibold">Dates à renouveler <span className="font-normal text-ink-2">(facultatif)</span></summary>
        <p className="mt-2 text-xs text-ink-2">Stack te prévient avant chaque échéance. Pour le domaine, le bouton « Récupérer la date » de la fiche appli la trouve tout seul.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Nom de domaine" hint="Date de fin de l'abonnement au domaine."><input type="date" className={inputCls} value={f.domainExpiry} onChange={set("domainExpiry")} /></Field>
          <Field label="Certificat SSL" hint="Le cadenas https. Souvent renouvelé tout seul : laisse vide si c'est le cas."><input type="date" className={inputCls} value={f.sslExpiry} onChange={set("sslExpiry")} /></Field>
          <Field label="Hébergement" hint="Date de renouvellement de l'offre d'hébergement."><input type="date" className={inputCls} value={f.hostingRenewal} onChange={set("hostingRenewal")} /></Field>
        </div>
      </details>
      <details className="rounded-xl border border-line p-3" open={!!(f.sentryProject || f.deployProvider || f.lastBackup)}>
        <summary className="cursor-pointer text-sm font-semibold">Options avancées <span className="font-normal text-ink-2">(facultatif, laisse vide si tu n&apos;utilises pas)</span></summary>
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-sm font-semibold">Sentry, les bugs du site</p>
            <p className="mb-2 text-xs text-ink-2">Sentry est un service gratuit qui enregistre les erreurs qui arrivent aux visiteurs de ton site. Si tu l&apos;as installé, Stack affiche ces erreurs dans l&apos;onglet « Erreurs » de la fiche. Sinon, ignore.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Organisation Sentry" hint="Visible dans l'adresse sentry.io/organizations/…"><input className={inputCls} value={f.sentryOrg} onChange={set("sentryOrg")} placeholder="mon-org" /></Field>
              <Field label="Projet Sentry"><input className={inputCls} value={f.sentryProject} onChange={set("sentryProject")} placeholder="mon-site" /></Field>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Mises en ligne</p>
            <p className="mb-2 text-xs text-ink-2">Si le site est publié avec Vercel, Netlify ou Coolify, Stack affiche l&apos;historique des mises en ligne dans la fiche.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Publié avec">
                <select className={inputCls} value={f.deployProvider} onChange={set("deployProvider")}><option value="">Aucun / je ne sais pas</option><option value="vercel">Vercel</option><option value="netlify">Netlify</option><option value="coolify">Coolify</option></select>
              </Field>
              <Field label="Identifiant du projet" hint="Dans les réglages du projet chez Vercel, Netlify ou Coolify."><input className={inputCls} value={f.deployProjectId} onChange={set("deployProjectId")} placeholder="prj_… / site id / uuid" /></Field>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Sauvegardes</p>
            <p className="mb-2 text-xs text-ink-2">Note quand tu as sauvegardé le site pour la dernière fois : Stack te rappelle quand il est temps d&apos;en refaire une.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dernière sauvegarde"><input type="date" className={inputCls} value={f.lastBackup} onChange={set("lastBackup")} /></Field>
              <Field label="À refaire tous les (jours)"><input type="number" min="1" className={inputCls} value={f.backupEveryDays} onChange={set("backupEveryDays")} placeholder="Ex. 30" /></Field>
            </div>
          </div>
        </div>
      </details>
      <Field label="Notes" hint="Ce que tu veux retenir sur ce site. Jamais de mot de passe ici."><textarea className={inputCls + " h-20 resize-none"} value={f.notes} onChange={set("notes")} /></Field>
      <div className="flex gap-2">
        {initial && <Button type="button" variant="ghost" className="text-down" onClick={() => { if (confirm(`Supprimer ${initial.name} ?`)) { removeApp(initial.id); onDone(); onDeleted?.(); } }}>Supprimer</Button>}
        <Button type="button" className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary">{initial ? "Enregistrer" : "Ajouter"}</Button>
      </div>
    </form>
  );
}

