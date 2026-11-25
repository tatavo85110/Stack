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

export interface IndyClientRow { name: string; kind: string; date: string; total: number }

/** Parses "#clients=<url-encoded JSON [[name, kind, 'DD/MM/YYYY', total], …]>". */
export function parseClientsHash(hash: string): IndyClientRow[] | null {
  const m = hash.match(/clients=([^&]+)/);
  if (!m) return null;
  try {
    const list = JSON.parse(decodeURIComponent(m[1])) as unknown[];
    const rows = list.flatMap((x) => {
      if (!Array.isArray(x) || typeof x[0] !== "string" || !x[0].trim()) return [];
      const d = String(x[2] ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return [{ name: x[0].trim(), kind: String(x[1] ?? ""), date: d ? `${d[3]}-${d[2]}-${d[1]}` : new Date().toISOString().slice(0, 10), total: Number(x[3]) || 0 }];
    });
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

/** Reads a "#indy=" link (sent by the bookmarklet or the daily job) once the store is loaded. */
export function useIndyHash(hydrated: boolean) {
  const setIndyMonthly = useStack((s) => s.setIndyMonthly);
  const syncIndyClients = useStack((s) => s.syncIndyClients);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!hydrated) return;
    const data = parseIndyHash(location.hash);
    const clients = parseClientsHash(location.hash);
    if (!data && !clients) return;
    const parts: string[] = [];
    if (data) { setIndyMonthly(data); parts.push(`CA mis à jour depuis Indy (${Object.keys(data).join(", ")})`); }
    if (clients) { const r = syncIndyClients(clients); parts.push(`Clients Indy : ${r.added} ajouté${r.added > 1 ? "s" : ""}, ${clients.length - r.added} déjà dans Stack`); }
    history.replaceState(null, "", location.pathname + location.search);
    setMsg(parts.join(" · "));
    const t = setTimeout(() => setMsg(""), 5000);
    return () => clearTimeout(t);
  }, [hydrated, setIndyMonthly, syncIndyClients]);
  return msg;
}

/**
 * Runs on app.indy.fr. On "Pilotage" it reads the "Chiffre d'affaires" row; on "Facturation › Clients"
 * it reads the client table (name, type, date added, total TTC). Then it opens Stack with the data in the link.
 */
export const EXTRACT_JS = `const t=document.body.innerText;let h='';if(/\\/clients/.test(location.pathname)){const r=[...document.querySelectorAll('tbody tr')].map(tr=>{const c=[...tr.querySelectorAll('td')].map(td=>td.innerText.split('\\n').map(s=>s.trim()).filter(Boolean));const n=(c[0]||[]).filter(s=>s.length>2);const tot=((c[3]||[])[0]||'0').replace(/[\\s\\u202f\\u00a0€]/g,'').replace(',','.');return[n[0]||'',n[1]||'',(c[1]||[])[0]||'',parseFloat(tot)||0]}).filter(r=>r[0]);if(r.length)h='clients='+encodeURIComponent(JSON.stringify(r))}else{const y=(t.match(/Exercice\\s+(\\d{4})/)||[])[1];const L=t.split('\\n').map(s=>s.trim()).filter(Boolean);for(let i=0;i<L.length;i++){if(/^Chiffre d.affaires$/i.test(L[i])){const n=L.slice(i+1,i+14).map(s=>s.replace(/[\\s\\u202f\\u00a0€]/g,'').replace(',','.'));if(y&&n.length===13&&n.every(s=>/^-?\\d+(\\.\\d+)?$/.test(s))){h='indy='+y+':'+n.slice(0,12).join(',');break}}}}`;

export function bookmarklet(stackUrl: string) {
  const code = `(()=>{${EXTRACT_JS}if(!h){alert("Ouvre Pilotage (pour le CA) ou Facturation › Clients sur Indy, attends que la page soit chargée, puis reclique.");return}window.open(${JSON.stringify(stackUrl)}+'#'+h,'_blank')})()`;
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
    <Card title="Indy : CA et clients" className="lg:col-span-2">
      <p className="text-sm text-ink-2">
        Stack lit le CA mois par mois sur ta page <a className="font-semibold text-bright" href={INDY_URL} target="_blank" rel="noreferrer">Pilotage d&apos;Indy</a>, et ta liste de clients dans Facturation › Clients (les nouveaux sont ajoutés à ton CRM). Ça se met à jour tout seul une fois par jour quand ton PC est allumé avec Chrome ouvert. Tu peux aussi le faire à la main en un clic :
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-2">
        <li>Glisse ce bouton dans ta barre de favoris : <a ref={ref} href="#" onClick={(e) => e.preventDefault()} className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-night px-3 py-1.5 text-xs font-semibold text-white"><BarChart3 size={13} /> CA → Stack</a></li>
        <li>Sur Indy, ouvre Pilotage (pour le CA) ou Facturation › Clients (pour les clients), puis clique sur ce favori. Stack s&apos;ouvre à jour.</li>
      </ol>
      <p className="mt-3 text-xs text-ink-2">{syncedAt ? `Dernière mise à jour : ${new Date(syncedAt).toLocaleString("fr-FR")}` : "Pas encore de mise à jour depuis Indy."}</p>
    </Card>
  );
}
