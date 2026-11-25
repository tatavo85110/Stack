"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Sun, FileText, Bug, Mail, Copy, Check } from "lucide-react";
import { useStack } from "@/lib/store";
import { askClaude, morningPrompt } from "@/lib/ai";
import { clientMonth } from "@/lib/report";
import { Button, Card, Empty, Field, PageHeader, Segmented, inputCls } from "@/components/ui";

type Tool = "matin" | "rapport" | "erreur" | "email";

function Result({ text, busy, error }: { text: string; busy: boolean; error: string }) {
  const [ok, setOk] = useState(false);
  if (busy) return <div className="mt-4 h-32 animate-pulse rounded-xl bg-muted" />;
  if (error) return <p className="mt-4 rounded-xl bg-down-bg p-3 text-sm text-down">{error}</p>;
  if (!text) return null;
  return (
    <div className="mt-4 rounded-xl bg-muted p-4">
      <p className="text-sm whitespace-pre-wrap">{text}</p>
      <Button className="mt-3" onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? <Check size={15} /> : <Copy size={15} />} Copier</Button>
    </div>
  );
}

function useAsk() {
  const [st, setSt] = useState({ text: "", busy: false, error: "" });
  const run = async (prompt: string, effort: "low" | "medium" = "medium") => {
    setSt({ text: "", busy: true, error: "" });
    try {
      const text = await askClaude(prompt, { effort });
      setSt({ text, busy: false, error: "" });
      return text;
    } catch (e) {
      setSt({ text: "", busy: false, error: e instanceof Error ? e.message : "Erreur" });
      return "";
    }
  };
  return { ...st, run };
}

function Morning() {
  const { morning, setMorning } = useStack();
  const a = useAsk();
  return (
    <Card title="Résumé du matin">
      <p className="text-sm text-ink-2">Claude lit l&apos;état de tes applis, projets, clients et tâches, et te dit par quoi commencer.</p>
      <Button variant="primary" className="mt-3" disabled={a.busy} onClick={async () => { const t = await a.run(morningPrompt(), "low"); if (t) setMorning(t); }}><Sun size={15} /> Faire mon résumé</Button>
      <Result text={a.text || (morning?.text ?? "")} busy={a.busy} error={a.error} />
    </Card>
  );
}

function Report() {
  const { clients } = useStack();
  const [clientId, setClientId] = useState(clients.find((c) => c.stage === "Actif")?.id ?? clients[0]?.id ?? "");
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15).toISOString().slice(0, 7));
  const a = useAsk();
  if (!clients.length) return <Card title="Rapport client"><Empty>Ajoute d&apos;abord un client.</Empty></Card>;
  return (
    <Card title="Rapport mensuel client">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Client"><select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Mois"><input type="month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" disabled={a.busy || !clientId} onClick={() => {
          const m = clientMonth(useStack.getState(), clientId, month);
          a.run(`Rédige le compte rendu mensuel à envoyer à mon client, à partir de ces données réelles :\n\n${m.text}\n\nTon professionnel et chaleureux, vouvoiement, 120 à 200 mots. Commence par « Bonjour », résume la disponibilité, les interventions et les heures, puis propose la suite. Signe avec « ${useStack.getState().settings.myName || "[ton nom]"} ».`);
        }}><FileText size={15} /> Rédiger le message</Button>
        <Link className="self-center text-sm font-semibold text-bright" href={`/clients/rapport?id=${clientId}&mois=${month}`}>Voir le rapport PDF</Link>
      </div>
      <Result {...a} />
    </Card>
  );
}

function ErrorAnalysis() {
  const { apps } = useStack();
  const withIssues = apps.filter((x) => x.sentryIssues?.length);
  const [pick, setPick] = useState("");
  const [text, setText] = useState("");
  const a = useAsk();
  return (
    <Card title="Analyser une erreur">
      {withIssues.length > 0 && (
        <Field label="Erreur Sentry">
          <select className={inputCls} value={pick} onChange={(e) => { setPick(e.target.value); const [aid, iid] = e.target.value.split("|"); const i = apps.find((x) => x.id === aid)?.sentryIssues?.find((x) => x.id === iid); if (i) setText(`${i.title}\nDans : ${i.culprit}\nOccurrences : ${i.count}, niveau ${i.level}`); }}>
            <option value="">Choisir…</option>
            {withIssues.flatMap((x) => x.sentryIssues!.map((i) => <option key={x.id + i.id} value={`${x.id}|${i.id}`}>{x.name} : {i.title.slice(0, 70)}</option>))}
          </select>
        </Field>
      )}
      <Field label="Ou colle le message d'erreur et la pile d'appels"><textarea className={inputCls + " mt-1 h-36 font-mono text-xs"} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <Button variant="primary" className="mt-3" disabled={a.busy || !text.trim()} onClick={() => {
        const app = apps.find((x) => x.id === pick.split("|")[0]);
        a.run(`Analyse cette erreur${app ? ` de l'appli ${app.name} (${app.stack}, hébergée chez ${app.host})` : ""} :\n\n${text}\n\nExplique en 2 phrases la cause la plus probable, puis donne les étapes pour corriger, puis comment vérifier que c'est réglé. Si des informations manquent, dis lesquelles.`);
      }}><Bug size={15} /> Analyser</Button>
      <Result {...a} />
    </Card>
  );
}

function EmailToTasks() {
  const { clients, projects, addTodos, addRequest, updateProject } = useStack();
  const [email, setEmail] = useState("");
  const [tasks, setTasks] = useState<{ label: string; on: boolean }[]>([]);
  const [target, setTarget] = useState("todos");
  const [clientId, setClientId] = useState("");
  const [done, setDone] = useState("");
  const a = useAsk();
  return (
    <Card title="Transformer un email en tâches">
      <Field label="Colle l'email du client"><textarea className={inputCls + " mt-1 h-36"} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Button variant="primary" className="mt-3" disabled={a.busy || !email.trim()} onClick={async () => {
        setDone("");
        const t = await a.run(`Voici un email d'un client :\n\n${email}\n\nListe les tâches concrètes que je dois faire, une par ligne, chacune commençant par « - », formulées comme des actions courtes (verbe à l'infinitif). Rien d'autre.`, "low");
        setTasks(t.split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean).map((label) => ({ label, on: true })));
      }}><Mail size={15} /> Extraire les tâches</Button>
      {a.busy && <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted" />}
      {a.error && <p className="mt-4 rounded-xl bg-down-bg p-3 text-sm text-down">{a.error}</p>}
      {tasks.length > 0 && (
        <div className="mt-4 space-y-3">
          <ul className="space-y-1">{tasks.map((t, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
              <input type="checkbox" checked={t.on} onChange={() => setTasks(tasks.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} className="size-4 accent-[var(--bright)]" aria-label={t.label} />
              <input className="flex-1 bg-transparent outline-none" value={t.label} onChange={(e) => setTasks(tasks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            </li>
          ))}</ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ajouter dans">
              <select className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="todos">Mes tâches du jour</option>
                {projects.filter((p) => p.column !== "done").map((p) => <option key={p.id} value={p.id}>Projet : {p.title}</option>)}
              </select>
            </Field>
            <Field label="Garder aussi comme demande du client"><select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}><option value="">Non</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          </div>
          <Button variant="primary" onClick={() => {
            const labels = tasks.filter((t) => t.on && t.label.trim()).map((t) => t.label.trim());
            if (target === "todos") addTodos(labels);
            else { const p = projects.find((x) => x.id === target); if (p) updateProject(p.id, { tasks: [...(p.tasks ?? []), ...labels.map((label) => ({ id: Math.random().toString(36).slice(2, 10), label, done: false }))] }); }
            if (clientId) addRequest({ clientId, from: clients.find((c) => c.id === clientId)?.name ?? "", date: new Date().toISOString().slice(0, 10), text: email.slice(0, 2000), status: "En cours" });
            setDone(`${labels.length} tâche${labels.length > 1 ? "s" : ""} ajoutée${labels.length > 1 ? "s" : ""}.`);
            setTasks([]);
          }}>Ajouter</Button>
        </div>
      )}
      {done && <p className="mt-3 rounded-xl bg-ok-bg p-3 text-sm font-semibold text-ok">{done}</p>}
    </Card>
  );
}

export default function Assistant() {
  const key = useStack((s) => s.settings.anthropicKey);
  const [tool, setTool] = useState<Tool>("matin");
  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Assistant" }]} title="Assistant Claude" />
      {!key && <p className="mb-5 rounded-xl bg-warn-bg p-4 text-sm text-warn"><Sparkles size={15} className="mr-1 inline" /> Pour utiliser l&apos;assistant, ajoute ta clé Claude dans <Link className="font-semibold underline" href="/reglages">Réglages</Link>. Tu la crées sur console.anthropic.com, rubrique API Keys. Elle reste sur cet appareil.</p>}
      <div className="mb-5"><Segmented<Tool> value={tool} onChange={setTool} options={[{ value: "matin", label: "Résumé du matin" }, { value: "rapport", label: "Rapport client" }, { value: "erreur", label: "Analyser une erreur" }, { value: "email", label: "Email en tâches" }]} /></div>
      <div className="max-w-3xl">
        {tool === "matin" && <Morning />}
        {tool === "rapport" && <Report />}
        {tool === "erreur" && <ErrorAnalysis />}
        {tool === "email" && <EmailToTasks />}
      </div>
    </>
  );
}
