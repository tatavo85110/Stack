"use client";
import { useState } from "react";
import { Cloud, CloudOff, Copy, LogOut, RefreshCw } from "lucide-react";
import { useStack } from "@/lib/store";
import { supabase, useSession, useSyncStatus, push, schemaSql, contactSnippet } from "@/lib/sync";
import { baseUrl } from "@/lib/share";
import { Button, Card, Field, inputCls } from "./ui";

export function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

export function SyncCard() {
  const { settings, setSettings } = useStack();
  const session = useSession();
  const sync = useSyncStatus();
  const [f, setF] = useState({ url: settings.supabaseUrl, key: settings.supabaseKey });
  const [cred, setCred] = useState({ email: settings.contactEmail, password: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const configured = !!(settings.supabaseUrl && settings.supabaseKey);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setBusy(false);
    }
  };
  const auth = () =>
    run(async () => {
      const sb = supabase();
      if (!sb) throw new Error("Enregistre d'abord l'URL et la clé.");
      if (!cred.password) throw new Error("Entre ton mot de passe.");
      const { error } = await sb.auth.signInWithPassword({ email: cred.email, password: cred.password });
      if (error) throw new Error(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
      setCred({ ...cred, password: "" });
      return "Connecté. Tes données se synchronisent.";
    });

  return (
    <Card title={<span className="flex items-center gap-2">{session ? <Cloud size={18} className="text-ok" /> : <CloudOff size={18} className="text-ink-2" />} Synchro téléphone et ordinateur</span>} className="lg:col-span-2">
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); setSettings({ supabaseUrl: f.url.trim().replace(/\/$/, ""), supabaseKey: f.key.trim() }); setMsg({ ok: true, text: "Projet Supabase enregistré." }); }}>
        <Field label="Project URL"><input className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://xxxx.supabase.co" /></Field>
        <Field label="Clé anon public"><input className={inputCls} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} placeholder="eyJ…" /></Field>
        <Button>Enregistrer</Button>
      </form>

      {configured && (
        <div className="mt-5 space-y-4">
          <details className="rounded-xl bg-muted p-4">
            <summary className="cursor-pointer text-sm font-semibold">Tables Supabase (déjà installées sur ton projet)</summary>
            <p className="mt-1 text-xs text-ink-2">Seulement si tu changes de projet Supabase : ouvre SQL Editor, puis New query, colle ce texte et clique sur Run. Pense aussi à fermer les inscriptions (Authentication, Sign In / Providers).</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" onClick={() => { copy(schemaSql()); setMsg({ ok: true, text: "Texte copié. Colle-le dans le SQL Editor de Supabase." }); }}><Copy size={15} /> Copier le texte pour Supabase</Button>
              <a className="self-center text-sm font-semibold text-bright" href={`${settings.supabaseUrl.replace(".supabase.co", "").replace("https://", "https://supabase.com/dashboard/project/")}/sql/new`} target="_blank" rel="noreferrer">Ouvrir le SQL Editor</a>
            </div>
          </details>

          {session ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex-1 text-sm">Connecté avec <b>{session.user.email}</b>. {sync.status === "busy" ? "Synchro en cours…" : sync.status === "error" ? <span className="text-down">Erreur : {sync.message}</span> : sync.last ? `Dernière synchro à ${new Date(sync.last).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.` : ""}</p>
              <Button type="button" onClick={() => { const sb = supabase(); if (sb) push(sb, session.user.id); }}><RefreshCw size={15} /> Synchroniser</Button>
              <Button type="button" variant="ghost" onClick={() => supabase()?.auth.signOut()}><LogOut size={15} /> Se déconnecter</Button>
            </div>
          ) : (
            <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); auth(); }}>
              <Field label="Ton email"><input type="email" autoComplete="email" className={inputCls} value={cred.email} onChange={(e) => setCred({ ...cred, email: e.target.value })} required /></Field>
              <Field label="Mot de passe Stack"><input type="password" autoComplete="current-password" className={inputCls} value={cred.password} onChange={(e) => setCred({ ...cred, password: e.target.value })} required /></Field>
              <Button variant="primary" disabled={busy}>Se connecter</Button>
            </form>
          )}
          {!session && <p className="text-xs text-ink-2">Connecte-toi avec le même email et le même mot de passe sur le PC et sur le téléphone. Ton compte se crée dans Supabase (Authentication, Users, Add user) : les inscriptions publiques sont fermées pour que personne d&apos;autre ne puisse entrer. Les clés (Claude, Sentry…) restent sur chaque appareil et ne sont jamais envoyées.</p>}

          <details className="rounded-xl border border-line p-4">
            <summary className="cursor-pointer text-sm font-semibold">Formulaire de contact de ton site (les messages deviennent des prospects)</summary>
            <p className="mt-2 text-xs text-ink-2">Colle ce code dans la page contact de ton site. Chaque message arrive dans Stack comme prospect, à l&apos;ouverture de l&apos;appli.</p>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-[11px]">{contactSnippet(settings.supabaseUrl, settings.supabaseKey)}</pre>
            <Button type="button" className="mt-2" onClick={() => { copy(contactSnippet(settings.supabaseUrl, settings.supabaseKey)); setMsg({ ok: true, text: "Code du formulaire copié." }); }}><Copy size={15} /> Copier le code</Button>
          </details>
        </div>
      )}
      {msg && <p className={`mt-3 rounded-xl p-3 text-sm font-semibold ${msg.ok ? "bg-ok-bg text-ok" : "bg-down-bg text-down"}`}>{msg.text}</p>}
    </Card>
  );
}
