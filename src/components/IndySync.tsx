"use client";
import { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useStack } from "@/lib/store";
import { Card } from "./ui";
import { INDY_URL } from "@/lib/format";

/** Parses "#indy=2026:0,0,…,93,0;2025:…" into { "2026": [12 numbers] }. */
export function parseIndyHash(hash: string): Record<string, number[]> | null {
  const m = hash.match(/indy=([^&]+)/);
  if (!m) return null;
  const out: Record<string, number[]> = {};
  for (const part of decodeURIComponent(m[1]).split(";")) {
    const [y, list] = part.split(":");
    const values = (list ?? "").split(",").map(Number);
    if (/^\d{4}$/.test(y) && values.length === 12 && values.every(Number.isFinite)) out[y] = values;
  }
  return Object.keys(out).length ? out : null;
}

/** Reads a "#indy=" link (sent by the bookmarklet or the daily job) once the store is loaded. */
export function useIndyHash(hydrated: boolean) {
  const setIndyMonthly = useStack((s) => s.setIndyMonthly);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!hydrated) return;
    const data = parseIndyHash(location.hash);
    if (!data) return;
    setIndyMonthly(data);
    history.replaceState(null, "", location.pathname + location.search);
    setMsg(`CA mis à jour depuis Indy (${Object.keys(data).join(", ")})`);
    const t = setTimeout(() => setMsg(""), 5000);
    return () => clearTimeout(t);
  }, [hydrated, setIndyMonthly]);
  return msg;
}

/** Runs on app.indy.fr › Pilotage: reads the "Chiffre d'affaires" row and opens Stack with it. */
export function bookmarklet(stackUrl: string) {
  const code = `(()=>{const t=document.body.innerText;const y=(t.match(/Exercice\\s+(\\d{4})/)||[])[1];const L=t.split('\\n').map(s=>s.trim()).filter(Boolean);let v=null;for(let i=0;i<L.length;i++){if(/^Chiffre d.affaires$/i.test(L[i])){const n=L.slice(i+1,i+14).map(s=>s.replace(/[\\s\\u202f\\u00a0€]/g,'').replace(',','.'));if(n.length===13&&n.every(s=>/^-?\\d+(\\.\\d+)?$/.test(s))){v=n.slice(0,12);break}}}if(!y||!v){alert("Ouvre la page Pilotage d'Indy, attends que le graphique s'affiche, puis reclique.");return}window.open(${JSON.stringify(stackUrl)}+'#indy='+y+':'+v.join(','),'_blank')})()`;
  return "javascript:" + encodeURIComponent(code);
}

export function IndySyncCard() {
  const syncedAt = useStack((s) => s.indySyncedAt);
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    // React refuses javascript: links in JSX, so the bookmarklet is set on the DOM directly.
    ref.current?.setAttribute("href", bookmarklet(`${location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`));
  }, []);
  return (
    <Card title="Chiffre d'affaires Indy" className="lg:col-span-2">
      <p className="text-sm text-ink-2">
        Stack lit le CA mois par mois sur ta page <a className="font-semibold text-bright" href={INDY_URL} target="_blank" rel="noreferrer">Pilotage d&apos;Indy</a>. Ça se met à jour tout seul une fois par jour quand ton PC est allumé avec Chrome ouvert. Tu peux aussi le faire à la main en un clic :
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-2">
        <li>Glisse ce bouton dans ta barre de favoris : <a ref={ref} href="#" onClick={(e) => e.preventDefault()} className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-night px-3 py-1.5 text-xs font-semibold text-white"><BarChart3 size={13} /> CA → Stack</a></li>
        <li>Sur Indy, ouvre Pilotage, puis clique sur ce favori. Stack s&apos;ouvre avec le CA à jour.</li>
      </ol>
      <p className="mt-3 text-xs text-ink-2">{syncedAt ? `Dernière mise à jour : ${new Date(syncedAt).toLocaleString("fr-FR")}` : "Pas encore de mise à jour depuis Indy."}</p>
    </Card>
  );
}
