"use client";
import { useEffect, useState } from "react";
import { Square } from "lucide-react";
import { useStack, useHydrated } from "@/lib/store";

export function useElapsed(startedAt?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return "00:00:00";
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerBar() {
  const hydrated = useHydrated();
  const timer = useStack((s) => s.timer);
  const stop = useStack((s) => s.stopTimer);
  const project = useStack((s) => s.projects.find((p) => p.id === s.timer?.projectId));
  const elapsed = useElapsed(timer?.startedAt);
  if (!hydrated || !timer) return null;
  return (
    <div className="animate-fade bg-night text-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2 text-sm md:px-8">
        <span className="size-2 animate-pulse rounded-full bg-sky" />
        <span className="truncate">
          Chrono : <b>{timer.label}</b>
          {project && <span className="text-white/60"> · {project.title}</span>}
        </span>
        <span className="ml-auto font-mono font-bold tabular-nums">{elapsed}</span>
        <button onClick={stop} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 font-semibold transition-colors hover:bg-white/20">
          <Square size={12} fill="currentColor" /> Arrêter
        </button>
      </div>
    </div>
  );
}
