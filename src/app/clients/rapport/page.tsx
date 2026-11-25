"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { useStack } from "@/lib/store";
import { clientMonth } from "@/lib/report";
import { Button, Empty, inputCls } from "@/components/ui";
import { LogoIcon } from "@/components/Logo";
import { hours, num, shortDate } from "@/lib/format";

export default function Page() {
  return <Suspense><Rapport /></Suspense>;
}

function Rapport() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id") ?? "";
  const month = sp.get("mois") ?? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15).toISOString().slice(0, 7);
  const st = useStack();
  const r = clientMonth(st, id, month);
  if (!r.client) return <Empty>Client introuvable. <Link className="text-bright" href="/clients">Retour aux clients</Link></Empty>;

  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <Link href={`/clients/fiche?id=${id}`} className="text-sm font-semibold text-bright">← {r.client.name}</Link>
        <input type="month" className={inputCls + " ml-auto w-auto"} value={month} onChange={(e) => router.replace(`/clients/rapport?id=${id}&mois=${e.target.value}`)} aria-label="Mois" />
        <Button variant="primary" onClick={() => window.print()}><Printer size={15} /> Enregistrer en PDF</Button>
      </div>
      <p className="no-print mb-4 text-xs text-ink-2">Dans la fenêtre d&apos;impression, choisis « Enregistrer au format PDF ».</p>
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-[#0b1f3a] shadow-card print:shadow-none">
        <header className="mb-8 flex items-start justify-between gap-4 border-b border-[#dce6f3] pb-6">
          <div>
            <p className="text-xs font-bold tracking-wider text-[#5a6b85] uppercase">Rapport mensuel</p>
            <h1 className="mt-1 text-2xl font-extrabold">{r.client.name}</h1>
            <p className="text-sm text-[#5a6b85] capitalize">{r.monthLabel}</p>
          </div>
          <div className="text-right text-sm">
            <LogoIcon size={36} />
            <p className="mt-2 font-semibold">{st.settings.myName}</p>
            <p className="text-[#5a6b85]">{st.settings.contactEmail}</p>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-3 gap-3">
          {[
            ["Disponibilité", r.apps.some((a) => a.uptime >= 0) ? `${num(r.apps.filter((a) => a.uptime >= 0).reduce((s, a) => s + a.uptime, 0) / r.apps.filter((a) => a.uptime >= 0).length, 2)} %` : "—"],
            ["Temps passé", hours(r.minutes)],
            ["Interventions", String(r.entries.length)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[#eaf1fb] p-4">
              <p className="text-xs font-semibold text-[#5a6b85]">{k}</p>
              <p className="mt-1 text-xl font-extrabold">{v}</p>
            </div>
          ))}
        </section>

        <h2 className="mb-3 text-base font-extrabold">Vos sites</h2>
        {r.apps.length ? (
          <table className="mb-8 w-full text-sm">
            <thead><tr className="border-b border-[#dce6f3] text-left text-xs text-[#5a6b85]"><th className="py-2">Site</th><th>Disponibilité</th><th>Temps de réponse</th><th>Mises en ligne</th></tr></thead>
            <tbody>{r.apps.map((a) => (
              <tr key={a.name} className="border-b border-[#eaf1fb]"><td className="py-2 font-semibold">{a.name}</td><td>{a.uptime >= 0 ? `${num(a.uptime, 2)} %` : "Non mesurée"}</td><td>{a.avgMs ? `${a.avgMs} ms` : "—"}</td><td>{a.deploys}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="mb-8 text-sm text-[#5a6b85]">Aucun site suivi pour ce client.</p>}

        <h2 className="mb-3 text-base font-extrabold">Interventions</h2>
        {r.entries.length ? (
          <table className="mb-8 w-full text-sm">
            <tbody>{r.entries.map((e) => (
              <tr key={e.id} className="border-b border-[#eaf1fb]"><td className="w-24 py-2 text-[#5a6b85]">{shortDate(e.date)}</td><td>{e.label}</td><td className="text-right">{hours(e.minutes)}</td></tr>
            ))}</tbody>
            <tfoot><tr><td /><td className="py-2 text-right font-semibold">Total</td><td className="text-right font-extrabold">{hours(r.minutes)}</td></tr></tfoot>
          </table>
        ) : <p className="mb-8 text-sm text-[#5a6b85]">Aucune intervention ce mois-ci.</p>}

        {(r.deliverables.length > 0 || r.requests.length > 0) && (
          <>
            <h2 className="mb-3 text-base font-extrabold">Livrables et demandes</h2>
            <ul className="mb-8 list-disc space-y-1 pl-5 text-sm">
              {r.deliverables.map((d) => <li key={d.id}>{d.label} ({d.project}), livré le {shortDate(d.date)}</li>)}
              {r.requests.map((q) => <li key={q.id}>Demande : {q.text.slice(0, 140)} ({q.status.toLowerCase()})</li>)}
            </ul>
          </>
        )}
        <footer className="border-t border-[#dce6f3] pt-4 text-xs text-[#5a6b85]">Rapport généré par Stack le {new Date().toLocaleDateString("fr-FR")}.</footer>
      </article>
    </>
  );
}
