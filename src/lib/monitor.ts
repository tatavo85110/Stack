"use client";
import { useEffect } from "react";
import { useStack } from "./store";
import { daysUntil } from "./format";

/**
 * Checks that a site answers, from the browser. Browsers hide the answer of other sites
 * (no-cors), so this tells "reachable or not" and the time it took, not the HTTP code.
 */
export async function pingUrl(url: string, timeoutMs = 10_000): Promise<{ ok: boolean; ms: number }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const u = new URL(url);
    u.searchParams.set("_stack", String(Date.now()));
    await fetch(u.toString(), { mode: "no-cors", cache: "no-store", signal: ctrl.signal, redirect: "follow" });
    return { ok: true, ms: Math.round(performance.now() - t0) };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkAllApps() {
  const { apps, recordCheck } = useStack.getState();
  await Promise.all(
    apps.filter((a) => /^https?:\/\/.+\..+/.test(a.url)).map(async (a) => {
      const before = a.status;
      const r = await pingUrl(a.url);
      recordCheck(a.id, { t: Date.now(), ...r });
      const after = useStack.getState().apps.find((x) => x.id === a.id)?.status;
      if (before !== "down" && after === "down") notify(`${a.name} ne répond plus`, a.url);
      if (before === "down" && after === "ok") notify(`${a.name} est de nouveau en ligne`, a.url);
    }),
  );
}

export function notify(title: string, body: string) {
  const { settings } = useStack.getState();
  if (!settings.notify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    navigator.serviceWorker?.getRegistration().then((reg) => { if (reg) reg.showNotification(title, { body, icon: "icon-192.png" }); else new Notification(title, { body }); });
  } catch {
    /* notifications are a bonus */
  }
}

/** Runs the site checks while Stack is open, and the daily reminders (deadlines, backups). */
export function useMonitor() {
  const minutes = useStack((s) => s.settings.monitorMinutes);
  const count = useStack((s) => s.apps.length);
  useEffect(() => {
    if (!count) return;
    const last = Math.max(0, ...useStack.getState().apps.map((a) => a.checks?.[0]?.t ?? 0));
    const wait = Math.max(0, last + minutes * 60_000 - Date.now());
    let iv: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      checkAllApps();
      iv = setInterval(checkAllApps, Math.max(1, minutes) * 60_000);
    }, Math.min(wait, 3000));
    return () => {
      clearTimeout(first);
      if (iv) clearInterval(iv);
    };
  }, [minutes, count]);

  useEffect(() => {
    const key = "stack-reminded";
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {
      return;
    }
    const { apps } = useStack.getState();
    for (const a of apps) {
      for (const [kind, d] of [["Domaine", a.domainExpiry], ["SSL", a.sslExpiry], ["Hébergement", a.hostingRenewal]] as const) {
        const n = daysUntil(d);
        if (n <= 14 && n >= 0) notify(`${kind} de ${a.name} : J-${n}`, "À renouveler bientôt");
      }
      if (a.lastBackup && a.backupEveryDays && -daysUntil(a.lastBackup) > a.backupEveryDays) notify(`Sauvegarde de ${a.name} en retard`, `Dernière le ${a.lastBackup}`);
    }
  }, []);
}
