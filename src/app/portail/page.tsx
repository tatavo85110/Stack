"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ExternalLink, Send } from "lucide-react";
import { unpack, type PortalData } from "@/lib/share";
import { pingUrl } from "@/lib/monitor";
import { LogoIcon } from "@/components/Logo";
import { Button, Card, Empty, Pill, Progress, inputCls } from "@/components/ui";
import { num, shortDate } from "@/lib/format";

const COL: Record<string, string> = { todo: "À venir", doing: "En cours", review: "En validation", done: "Terminé" };

export default function Portail() {
  const [d, setD] = useState<PortalData | null>(null);
  const [bad, setBad] = useState(false);
  const [live, setLive] = useState<Record<string, boolean | null>>({});
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState<"" | "ok" | "error">("");

  useEffect(() => {
    const raw = new URLSearchParams(location.hash.slice(1)).get("d");
    if (!raw) return setBad(true);
    unpack<PortalData>(raw).then(setD).catch(() => setBad(true));
  }, []);
  useEffect(() => {
    d?.apps.forEach((a) => pingUrl(a.url).then((r) => setLive((l) => ({ ...l, [a.url]: r.ok }))));
  }, [d]);

  if (bad) return <Empty>Ce lien de portail est incomplet. Demandez un nouveau lien à votre prestataire.</Empty>;
  if (!d) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;

  const send = async () => {
    if (!text.trim()) return;
    if (d.inbox) {
      try {
        const r = await fetch(`${d.inbox.url}/rest/v1/stack_inbox`, {
          method: "POST",
          headers: { apikey: d.inbox.key, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ kind: "demande", name: name || d.client, email: "", message: text.trim().slice(0, 5000), client_ref: d.client }),
        });
        if (!r.ok) throw new Error();
        setSent("ok");
        setText("");
      } catch {
        setSent("error");
      }
    } else {
      location.href = `mailto:${d.email}?subject=${encodeURIComponent(`Demande de ${d.client}`)}&body=${encodeURIComponent(text)}`;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 rounded-3xl bg-night p-6 text-white">
        <LogoIcon size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-sky">Espace client</p>
          <h1 className="text-2xl font-extrabold">{d.client}</h1>
          <p className="text-sm text-[#a9bdd8]">Suivi par {d.from || "votre prestataire"} · mis à jour le {shortDate(d.at)}</p>
        </div>
      </header>

      <Card title="Vos sites">
        {d.apps.length ? (
          <ul className="divide-y divide-line">
            {d.apps.map((a) => {
              const ok = live[a.url];
              return (
                <li key={a.url} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold hover:text-bright">{a.name} <ExternalLink size={13} /></a>
                    <p className="text-xs text-ink-2">{a.uptime >= 0 ? `Disponibilité 30 jours : ${num(a.uptime, 2)} %` : "Disponibilité en cours de mesure"}</p>
                  </div>
                  <Pill tone={ok === null || ok === undefined ? "neutral" : ok ? "ok" : "down"} dot>{ok === undefined ? "Vérification…" : ok ? "En ligne" : "Injoignable"}</Pill>
                </li>
              );
            })}
          </ul>
        ) : <Empty>Aucun site suivi pour l&apos;instant.</Empty>}
      </Card>

      {d.projects.map((p) => (
        <Card key={p.title} title={p.title} action={<Pill tone={p.column === "done" ? "ok" : "info"}>{COL[p.column] ?? p.column}</Pill>}>
          <div className="mb-4 flex items-center gap-3"><div className="flex-1"><Progress value={p.progress} /></div><span className="text-sm font-bold">{p.progress} %</span></div>
          {p.due && p.column !== "done" && <p className="mb-3 text-sm text-ink-2">Livraison prévue le {new Date(p.due).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>}
          {p.tasks.length > 0 && (
            <ul className="mb-4 space-y-1.5">
              {p.tasks.map((t, i) => <li key={i} className="flex items-center gap-2 text-sm">{t.done ? <CheckCircle2 size={16} className="text-ok" /> : <Circle size={16} className="text-ink-2" />}<span className={t.done ? "text-ink-2" : ""}>{t.label}</span></li>)}
            </ul>
          )}
          {p.deliverables.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold tracking-wider text-ink-2 uppercase">Livrables</p>
              <ul className="space-y-1.5">{p.deliverables.map((x, i) => <li key={i}><a className="flex items-center gap-1.5 text-sm font-semibold text-bright" href={x.url} target="_blank" rel="noreferrer">{x.label} <ExternalLink size={13} /></a></li>)}</ul>
            </div>
          )}
        </Card>
      ))}

      <Card title="Faire une demande">
        <p className="mb-3 text-sm text-ink-2">Une modification, un souci, une question ? Écrivez-la ici.</p>
        {d.inbox && <input className={inputCls + " mb-2"} placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} />}
        <textarea className={inputCls + " h-32"} value={text} onChange={(e) => { setText(e.target.value); setSent(""); }} placeholder="Votre demande" />
        <Button variant="primary" className="mt-3" onClick={send} disabled={!text.trim()}><Send size={15} /> Envoyer</Button>
        {sent === "ok" && <p className="mt-3 rounded-xl bg-ok-bg p-3 text-sm font-semibold text-ok">Demande envoyée, merci.</p>}
        {sent === "error" && <p className="mt-3 rounded-xl bg-down-bg p-3 text-sm text-down">L&apos;envoi n&apos;a pas marché. Écrivez à <a className="underline" href={`mailto:${d.email}`}>{d.email}</a>.</p>}
      </Card>
      <p className="text-center text-xs text-ink-2">Gardez ce lien pour vous : il donne accès à cet espace.</p>
    </div>
  );
}
