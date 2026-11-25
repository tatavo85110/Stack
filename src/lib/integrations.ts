import type { App, ContentItem, Deploy, SentryIssue, Settings } from "./types";

class ApiError extends Error {}
const explain = (service: string, e: unknown) =>
  new ApiError(
    e instanceof TypeError
      ? `${service} n'a pas répondu depuis le navigateur (réseau ou blocage du service). Vérifie ta connexion et la clé.`
      : e instanceof Error ? e.message : `${service} : erreur inconnue.`,
  );

async function getJson(url: string, init: RequestInit, service: string) {
  let r: Response;
  try {
    r = await fetch(url, init);
  } catch (e) {
    throw explain(service, e);
  }
  if (r.status === 401 || r.status === 403) throw new ApiError(`${service} refuse la clé (${r.status}). Vérifie-la dans Réglages.`);
  if (r.status === 404) throw new ApiError(`${service} ne trouve pas ce projet (404). Vérifie l'identifiant.`);
  if (!r.ok) throw new ApiError(`${service} a répondu ${r.status}.`);
  return r.json();
}

/** Unresolved Sentry issues of the last 14 days for one project. */
export async function fetchSentry(app: App, s: Settings): Promise<SentryIssue[]> {
  if (!s.sentryToken) throw new ApiError("Ajoute ton jeton Sentry dans Réglages.");
  if (!app.sentryOrg || !app.sentryProject) throw new ApiError("Renseigne l'organisation et le projet Sentry de l'appli.");
  const data = (await getJson(
    `https://sentry.io/api/0/projects/${encodeURIComponent(app.sentryOrg)}/${encodeURIComponent(app.sentryProject)}/issues/?query=is:unresolved&statsPeriod=14d&limit=25`,
    { headers: { Authorization: `Bearer ${s.sentryToken}` } },
    "Sentry",
  )) as { id: string; title: string; culprit: string; count: string; lastSeen: string; level: string; permalink: string }[];
  return data.map((i) => ({ id: i.id, title: i.title, culprit: i.culprit, count: Number(i.count) || 0, lastSeen: i.lastSeen, level: i.level, permalink: i.permalink }));
}

/** Last deployments from Vercel, Netlify or Coolify. */
export async function fetchDeploys(app: App, s: Settings): Promise<Deploy[]> {
  const id = app.deployProjectId?.trim();
  if (!app.deployProvider || !id) throw new ApiError("Choisis l'hébergeur et l'identifiant du projet dans « Modifier ».");
  if (app.deployProvider === "vercel") {
    if (!s.vercelToken) throw new ApiError("Ajoute ton jeton Vercel dans Réglages.");
    const team = s.vercelTeamId ? `&teamId=${encodeURIComponent(s.vercelTeamId)}` : "";
    const d = (await getJson(`https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(id)}&limit=15${team}`, { headers: { Authorization: `Bearer ${s.vercelToken}` } }, "Vercel")) as {
      deployments: { uid: string; state: string; target?: string | null; created: number; creator?: { username?: string }; meta?: Record<string, string> }[];
    };
    return d.deployments.map((x) => ({
      id: x.uid,
      message: x.meta?.githubCommitMessage ?? x.meta?.gitlabCommitMessage ?? "Déploiement",
      status: x.state === "READY" ? (x.target === "production" ? "Réussi" : "Preview") : x.state === "ERROR" || x.state === "CANCELED" ? "Échoué" : "Preview",
      date: new Date(x.created).toISOString(),
      author: x.creator?.username ?? "",
    }));
  }
  if (app.deployProvider === "netlify") {
    if (!s.netlifyToken) throw new ApiError("Ajoute ton jeton Netlify dans Réglages.");
    const d = (await getJson(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(id)}/deploys?per_page=15`, { headers: { Authorization: `Bearer ${s.netlifyToken}` } }, "Netlify")) as {
      id: string; state: string; context: string; created_at: string; title?: string | null; committer?: string | null;
    }[];
    return d.map((x) => ({ id: x.id, message: x.title || "Déploiement", status: x.state === "ready" ? (x.context === "production" ? "Réussi" : "Preview") : x.state === "error" ? "Échoué" : "Preview", date: x.created_at, author: x.committer ?? "" }));
  }
  if (!s.coolifyUrl || !s.coolifyToken) throw new ApiError("Ajoute l'adresse et le jeton de ton Coolify dans Réglages.");
  const d = (await getJson(`${s.coolifyUrl.replace(/\/$/, "")}/api/v1/deployments/applications/${encodeURIComponent(id)}?take=15`, { headers: { Authorization: `Bearer ${s.coolifyToken}` } }, "Coolify")) as
    | { deployments?: { deployment_uuid: string; status: string; created_at: string; commit_message?: string | null }[] }
    | { deployment_uuid: string; status: string; created_at: string; commit_message?: string | null }[];
  const list = Array.isArray(d) ? d : d.deployments ?? [];
  return list.map((x) => ({ id: x.deployment_uuid, message: x.commit_message || "Déploiement", status: x.status === "finished" ? "Réussi" : x.status === "failed" ? "Échoué" : "Preview", date: x.created_at, author: "" }));
}

/** Domain expiry date through RDAP (the public successor of WHOIS). */
export async function fetchDomainExpiry(url: string): Promise<string> {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    throw new ApiError("L'adresse de l'appli n'est pas valide.");
  }
  const tld = host.split(".").pop();
  const servers = tld === "fr" ? [`https://rdap.nic.fr/domain/${host}`, `https://rdap.org/domain/${host}`] : [`https://rdap.org/domain/${host}`];
  let last: unknown;
  for (const s of servers) {
    try {
      const d = (await getJson(s, { headers: { Accept: "application/rdap+json" } }, "Le registre du domaine")) as { events?: { eventAction: string; eventDate: string }[] };
      const exp = d.events?.find((e) => e.eventAction === "expiration")?.eventDate;
      if (exp) return exp.slice(0, 10);
      last = new ApiError("Le registre ne donne pas de date d'expiration pour ce domaine.");
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new ApiError("Date d'expiration introuvable.");
}

const toB64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};

/** Writes the site content as a JSON file in a GitHub repository (the site reads it at build time). */
export async function publishToGitHub(json: string, s: Settings): Promise<string> {
  if (!s.githubToken || !s.githubRepo) throw new ApiError("Renseigne le dépôt et le jeton GitHub dans Réglages.");
  const path = s.githubPath.replace(/^\//, "") || "content/stack.json";
  const api = `https://api.github.com/repos/${s.githubRepo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  const headers = { Authorization: `Bearer ${s.githubToken}`, Accept: "application/vnd.github+json" };
  let sha: string | undefined;
  try {
    const r = await fetch(`${api}?ref=${encodeURIComponent(s.githubBranch || "main")}`, { headers });
    if (r.ok) sha = ((await r.json()) as { sha: string }).sha;
  } catch (e) {
    throw explain("GitHub", e);
  }
  const d = (await getJson(api, { method: "PUT", headers, body: JSON.stringify({ message: "Contenu du site mis à jour depuis Stack", content: toB64(json), branch: s.githubBranch || "main", sha }) }, "GitHub")) as { commit: { html_url: string } };
  return d.commit.html_url;
}

/** The JSON file the website reads: only published items, newest first. */
export function siteJson(items: ContentItem[]) {
  const pub = items.filter((i) => i.published).sort((a, b) => b.date.localeCompare(a.date));
  const strip = ({ id, title, body, url, image, author, date, tags }: ContentItem) => ({ id, title, body, url, image, author, date, tags });
  return JSON.stringify({ updatedAt: new Date().toISOString(), projets: pub.filter((i) => i.kind === "projet").map(strip), temoignages: pub.filter((i) => i.kind === "temoignage").map(strip), articles: pub.filter((i) => i.kind === "article").map(strip) }, null, 2);
}

