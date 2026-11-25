import Anthropic from "@anthropic-ai/sdk";
import { useStack } from "./store";
import { eur, daysUntil } from "./format";
import { revenueThisMonth, monthlyAverage, weekMinutes } from "./stats";

const MODEL = "claude-opus-5-5";

/** Plain-French explanation of an API failure. */
function explain(e: unknown) {
  if (e instanceof Anthropic.AuthenticationError) return "Ta clé Claude est refusée. Vérifie-la dans Réglages.";
  if (e instanceof Anthropic.PermissionDeniedError) return "Ta clé Claude n'a pas accès à ce modèle.";
  if (e instanceof Anthropic.RateLimitError) return "Trop de demandes d'un coup. Réessaie dans une minute.";
  if (e instanceof Anthropic.APIConnectionError) return "Impossible de joindre Claude. Vérifie ta connexion.";
  if (e instanceof Anthropic.APIError) return `Claude a répondu une erreur (${e.status}).`;
  return e instanceof Error ? e.message : "Erreur inconnue.";
}

const SYSTEM =
  "Tu es l'assistant de Stack, le cockpit d'un développeur freelance français (micro-entreprise). " +
  "Réponds en français, avec des phrases simples et courtes, sans jargon inutile. " +
  "Ne donne jamais de mot de passe et n'en demande jamais. N'invente pas de chiffres : utilise seulement les données fournies.";

/** One Claude call from the browser, with the key saved on this device only. */
export async function askClaude(prompt: string, opts: { effort?: "low" | "medium" | "high"; maxTokens?: number } = {}): Promise<string> {
  const key = useStack.getState().settings.anthropicKey;
  if (!key) throw new Error("Ajoute ta clé Claude dans Réglages pour utiliser l'assistant.");
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: opts.effort ?? "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    if (msg.stop_reason === "refusal") throw new Error("Claude a refusé cette demande.");
    return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
  } catch (e) {
    throw new Error(explain(e));
  }
}

/** A compact, password-free snapshot of the cockpit, for the prompts. */
export function contextSnapshot() {
  const s = useStack.getState();
  const name = (id?: string) => s.clients.find((c) => c.id === id)?.name ?? "perso";
  const lines = [
    `Date : ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    `CA du mois (Indy) : ${eur(revenueThisMonth(s.clients))}, moyenne mensuelle : ${eur(monthlyAverage(s.clients))}`,
    `Temps cette semaine : ${Math.round(weekMinutes(s.time).reduce((a, b) => a + b.value, 0) / 60)} h`,
    "Applis :",
    ...s.apps.map((a) => {
      const dl = [["domaine", a.domainExpiry], ["SSL", a.sslExpiry], ["hébergement", a.hostingRenewal]].filter(([, d]) => d && daysUntil(d) <= 45).map(([k, d]) => `${k} J-${daysUntil(d)}`);
      return `- ${a.name} (${name(a.clientId)}) : ${a.status === "ok" ? "en ligne" : a.status === "warn" ? "alerte" : "hors ligne"}${a.sentryIssues?.length ? `, ${a.sentryIssues.length} erreurs Sentry ouvertes` : ""}${dl.length ? `, échéances : ${dl.join(", ")}` : ""}`;
    }),
    "Projets en cours :",
    ...s.projects.filter((p) => p.column !== "done").map((p) => `- ${p.title} (${name(p.clientId)}), ${p.progress} %, échéance ${p.due || "non fixée"}`),
    "Prochaines actions clients :",
    ...s.clients.filter((c) => c.nextAction).map((c) => `- ${c.name} : ${c.nextAction!.label} le ${c.nextAction!.date}`),
    "Demandes clients ouvertes :",
    ...s.requests.filter((r) => r.status !== "Faite").map((r) => `- ${r.from} : ${r.text.slice(0, 160)}`),
    "Tâches :",
    ...s.todos.filter((t) => !t.done).map((t) => `- ${t.label}`),
  ];
  return lines.join("\n");
}

export const morningPrompt = () =>
  `Voici l'état de mon cockpit ce matin :\n\n${contextSnapshot()}\n\nFais-moi un résumé du matin en 5 à 8 puces courtes : ce qui est urgent (site en panne, échéance proche, erreur), ce que je dois faire aujourd'hui, et un point positif. Termine par la tâche à attaquer en premier.`;
