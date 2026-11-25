"use client";
import { useRef, useState } from "react";
import { Download, Upload, Trash2, Sparkles, Moon, Sun, Bell } from "lucide-react";
import { SyncCard } from "@/components/SyncCard";
import { IndySyncCard } from "@/components/IndySync";
import type { Settings } from "@/lib/types";
import { useStack } from "@/lib/store";
import { Button, Card, Field, PageHeader, inputCls } from "@/components/ui";

export default function Reglages() {
  const { theme, toggleTheme, exportData, importData, clearAll, loadDemo, settings, setSettings } = useStack();
  const field = (k: keyof Settings, label: string, opts: { type?: string; placeholder?: string; secret?: boolean } = {}) => (
    <Field label={label}>
      <input
        className={inputCls}
        type={opts.secret ? "password" : opts.type ?? "text"}
        autoComplete="off"
        placeholder={opts.placeholder}
        value={String(settings[k] ?? "")}
        onChange={(e) => setSettings({ [k]: opts.type === "number" ? Number(e.target.value) : e.target.value } as Partial<Settings>)}
      />
    </Field>
  );
  const askNotify = async () => {
    if (typeof Notification === "undefined") return setMsg({ ok: false, text: "Ce navigateur ne gère pas les alertes. Sur iPhone, installe d'abord Stack sur l'écran d'accueil." });
    const p = await Notification.requestPermission();
    setSettings({ notify: p === "granted" });
    setMsg(p === "granted" ? { ok: true, text: "Alertes activées sur cet appareil." } : { ok: false, text: "Alertes refusées par le navigateur." });
  };
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stack-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setMsg({ ok: true, text: "Sauvegarde téléchargée. Range-la dans ton dossier SAAS sur Google Drive." });
  };
  const restore = async (f?: File) => {
    if (!f) return;
    try {
      importData(await f.text());
      setMsg({ ok: true, text: "Sauvegarde restaurée." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Fichier illisible." });
    }
  };

  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Réglages" }]} title="Réglages" />
      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <Card title="Apparence">
          <Button onClick={toggleTheme}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} Passer en thème {theme === "dark" ? "clair" : "sombre"}</Button>
        </Card>
        <Card title="Toi">
          <div className="grid gap-3 sm:grid-cols-2">
            {field("myName", "Ton nom (affiché aux clients)")}
            {field("contactEmail", "Email de contact (portail client)", { type: "email" })}
            {field("hourlyRate", "Taux horaire (€/h)", { type: "number" })}
            {field("monitorMinutes", "Vérifier les sites toutes les (min)", { type: "number" })}
          </div>
          <Button className="mt-3 !whitespace-normal text-left" onClick={askNotify}><Bell size={16} /> {settings.notify ? "Alertes activées" : "Activer les alertes (site en panne, échéances)"}</Button>
        </Card>
        <SyncCard />
        <IndySyncCard />
        <Card title="Clés des services" className="lg:col-span-2">
          <p className="mb-4 text-sm text-ink-2">Ces clés restent sur cet appareil. Elles ne sont ni synchronisées, ni dans les sauvegardes, ni sur GitHub. Mets-les sur chaque appareil où tu en as besoin.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field("anthropicKey", "Clé Claude (console.anthropic.com)", { secret: true, placeholder: "sk-ant-…" })}
            {field("sentryToken", "Jeton Sentry (scope project:read)", { secret: true })}
            {field("vercelToken", "Jeton Vercel", { secret: true })}
            {field("vercelTeamId", "Équipe Vercel (facultatif)")}
            {field("netlifyToken", "Jeton Netlify", { secret: true })}
            {field("coolifyUrl", "Adresse de ton Coolify", { placeholder: "https://coolify.mondomaine.fr" })}
            {field("coolifyToken", "Jeton Coolify", { secret: true })}
            {field("githubToken", "Jeton GitHub (contenu du site)", { secret: true, placeholder: "github_pat_…" })}
            {field("githubRepo", "Dépôt de ton site", { placeholder: "tatavo85110/mon-site" })}
            {field("githubBranch", "Branche")}
            {field("githubPath", "Fichier de contenu")}
          </div>
          <p className="mt-3 text-xs text-ink-2">Jeton GitHub : crée un « fine-grained token » limité au dépôt de ton site, avec seulement « Contents : Read and write ».</p>
        </Card>
        <Card title="Sauvegarde" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={download}><Download size={16} /> Télécharger une sauvegarde</Button>
            <Button onClick={() => ref.current?.click()}><Upload size={16} /> Restaurer une sauvegarde</Button>
            <input ref={ref} type="file" accept=".json,application/json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
          </div>
          <p className="mt-3 text-xs text-ink-2">Restaurer remplace les données de cet appareil par celles du fichier.</p>
          {msg && <p className={`mt-3 rounded-xl p-3 text-sm font-semibold ${msg.ok ? "bg-ok-bg text-ok" : "bg-down-bg text-down"}`}>{msg.text}</p>}
        </Card>
        <Card title="Repartir de zéro" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="text-down" onClick={() => { if (confirm("Tout effacer ? Pense à télécharger une sauvegarde avant.")) { clearAll(); setMsg({ ok: true, text: "Tout est effacé." }); } }}><Trash2 size={16} /> Tout effacer</Button>
            <Button onClick={() => { if (confirm("Remplacer tes données par des exemples ?")) { loadDemo(); setMsg({ ok: true, text: "Données d'exemple chargées." }); } }}><Sparkles size={16} /> Charger des exemples</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
