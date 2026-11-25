import type { App, Client, ClientRequest, Project, TimeEntry } from "./types";
import { hours } from "./format";

interface Data { clients: Client[]; apps: App[]; projects: Project[]; time: TimeEntry[]; requests: ClientRequest[] }

/** Everything that happened for one client during one month (YYYY-MM), for the monthly report. */
export function clientMonth(st: Data, clientId: string, month: string) {
  const client = st.clients.find((c) => c.id === clientId);
  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1).getTime(), to = new Date(y, m, 1).getTime();
  const inMonth = (iso: string) => iso.startsWith(month);
  const apps = st.apps.filter((a) => a.clientId === clientId).map((a) => {
    const checks = (a.checks ?? []).filter((c) => c.t >= from && c.t < to);
    const ok = checks.filter((c) => c.ok);
    return {
      name: a.name,
      url: a.url,
      checks: checks.length,
      uptime: checks.length ? (ok.length / checks.length) * 100 : -1,
      avgMs: ok.length ? Math.round(ok.reduce((s, c) => s + c.ms, 0) / ok.length) : 0,
      incidents: checks.filter((c) => !c.ok).length,
      deploys: a.deploys.filter((d) => inMonth(d.date)).length,
      errors: (a.sentryIssues ?? []).filter((i) => inMonth(i.lastSeen)).length,
    };
  });
  const projectIds = new Set(st.projects.filter((p) => p.clientId === clientId).map((p) => p.id));
  const entries = st.time.filter((t) => projectIds.has(t.projectId) && inMonth(t.date)).sort((a, b) => a.date.localeCompare(b.date));
  const minutes = entries.reduce((s, t) => s + t.minutes, 0);
  const billable = entries.filter((t) => t.billable).reduce((s, t) => s + t.minutes, 0);
  const projects = st.projects.filter((p) => p.clientId === clientId);
  const deliverables = projects.flatMap((p) => (p.deliverables ?? []).filter((d) => inMonth(d.date)).map((d) => ({ ...d, project: p.title })));
  const requests = st.requests.filter((r) => r.clientId === clientId && inMonth(r.date));
  const monthLabel = new Date(y, m - 1, 15).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const text = [
    `Client : ${client?.name ?? "?"}, mois : ${monthLabel}`,
    ...apps.map((a) => `Site ${a.name} : disponibilité ${a.uptime >= 0 ? a.uptime.toFixed(2) + " %" : "non mesurée"}, ${a.incidents} vérifications en échec, ${a.deploys} mises en ligne, ${a.errors} erreurs vues`),
    `Temps passé : ${hours(minutes)} dont ${hours(billable)} facturables`,
    ...entries.map((e) => `- ${e.date} : ${e.label} (${hours(e.minutes)})`),
    ...projects.filter((p) => p.column !== "done" || p.tasks?.length).map((p) => `Projet ${p.title} : ${p.progress} %`),
    ...deliverables.map((d) => `Livrable : ${d.label} (${d.project})`),
    ...requests.map((r) => `Demande du client : ${r.text.slice(0, 200)} (${r.status})`),
  ].join("\n");
  return { client, apps, entries, minutes, billable, projects, deliverables, requests, monthLabel, text };
}
