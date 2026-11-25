"use client";
import { useState } from "react";
import Link from "next/link";
import { Sun } from "lucide-react";
import { useStack } from "@/lib/store";
import { askClaude, morningPrompt } from "@/lib/ai";
import { Button, Card } from "./ui";

export function MorningWidget() {
  const { morning, setMorning, settings } = useStack();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const go = async () => {
    setBusy(true);
    setError("");
    try {
      setMorning(await askClaude(morningPrompt(), { effort: "low" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Résumé du matin" action={settings.anthropicKey ? <Button onClick={go} disabled={busy}><Sun size={15} /> {morning?.date === today ? "Refaire" : "Faire mon résumé"}</Button> : undefined}>
      {!settings.anthropicKey ? (
        <p className="text-sm text-ink-2">Ajoute ta clé Claude dans <Link className="font-semibold text-bright" href="/reglages">Réglages</Link> pour que Claude te dise chaque matin par quoi commencer.</p>
      ) : busy ? (
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      ) : morning ? (
        <>
          <p className="text-sm whitespace-pre-wrap">{morning.text}</p>
          {morning.date !== today && <p className="mt-2 text-xs text-ink-2">Résumé du {new Date(morning.date).toLocaleDateString("fr-FR")}.</p>}
        </>
      ) : (
        <p className="text-sm text-ink-2">Clique sur « Faire mon résumé ».</p>
      )}
      {error && <p className="mt-3 rounded-xl bg-down-bg p-3 text-sm text-down">{error}</p>}
    </Card>
  );
}
