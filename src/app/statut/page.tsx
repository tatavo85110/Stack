"use client";
import { useEffect, useState } from "react";
import { unpack, type StatusData } from "@/lib/share";
import { pingUrl } from "@/lib/monitor";
import { LogoIcon } from "@/components/Logo";
import { Card, Empty } from "@/components/ui";
import { UptimeStrip } from "@/components/charts";
import { num, shortDate } from "@/lib/format";

export default function Statut() {
  const [d, setD] = useState<StatusData | null>(null);
  const [bad, setBad] = useState(false);
  const [live, setLive] = useState<{ ok: boolean; ms: number } | null>(null);
  useEffect(() => {
    const raw = new URLSearchParams(location.hash.slice(1)).get("d");
    if (!raw) return setBad(true);
    unpack<StatusData>(raw).then(setD).catch(() => setBad(true));
  }, []);
  useEffect(() => {
    if (d) pingUrl(d.url).then(setLive);
  }, [d]);
  if (bad) return <Empty>Lien de statut incomplet.</Empty>;
  if (!d) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  const series = d.series.filter((v) => v >= 0);
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3"><LogoIcon size={36} /><h1 className="text-xl font-extrabold">Statut de {d.name}</h1></header>
      <div className={`rounded-3xl p-6 text-lg font-extrabold ${live === null ? "bg-muted" : live.ok ? "bg-ok-bg text-ok" : "bg-down-bg text-down"}`}>
        {live === null ? "Vérification en cours…" : live.ok ? `Le site fonctionne normalement (${live.ms} ms)` : "Le site ne répond pas en ce moment"}
      </div>
      <Card title="Disponibilité, 30 jours">
        {series.length ? <><UptimeStrip values={d.series.map((v) => (v < 0 ? 100 : v))} /><p className="mt-3 text-sm text-ink-2">{d.uptime >= 0 ? `${num(d.uptime, 2)} % sur 30 jours.` : ""} Relevé du {shortDate(d.at)}.</p></> : <Empty>Pas encore assez de mesures.</Empty>}
      </Card>
      <p className="text-center text-xs text-ink-2"><a className="text-bright" href={d.url}>{d.url}</a></p>
    </div>
  );
}
