"use client";
import { useRef, useState } from "react";
import { Download, Upload, Trash2, Sparkles, Moon, Sun } from "lucide-react";
import { useStack } from "@/lib/store";
import { Button, Card, PageHeader } from "@/components/ui";

export default function Reglages() {
  const { theme, toggleTheme, exportData, importData, clearAll, loadDemo } = useStack();
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
        <Card title="Où sont mes données ?">
          <p className="text-sm text-ink-2">Pour l&apos;instant, tes données sont enregistrées dans ce navigateur, sur cet appareil. Elles ne partent nulle part. Pour les garder en sécurité ou les passer sur un autre appareil, télécharge une sauvegarde et range-la sur ton Drive.</p>
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
