"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Shows a banner when a newer version of Stack has been deployed since this page was loaded. */
export function UpdateBanner() {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!BUILD || location.hostname === "localhost") return;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      fetch(`${BASE}/version.json?t=${Date.now()}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((v) => { if (v?.id && v.id !== BUILD) setStale(true); })
        .catch(() => {});
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { clearInterval(t); window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, []);
  if (!stale) return null;
  return (
    <button onClick={() => location.reload()} className="fixed bottom-20 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-night px-4 py-2.5 text-sm font-semibold text-white shadow-lg lg:bottom-6">
      <RefreshCw size={15} /> Nouvelle version de Stack, touche pour recharger
    </button>
  );
}
