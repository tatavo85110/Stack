"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { supabase } from "@/lib/sync";

/** Tells this device it is not signed in to the sync, so its data stays local. */
export function SyncBanner({ path }: { path: string }) {
  const [signedOut, setSignedOut] = useState(false);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSignedOut(!data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSignedOut(!s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!signedOut || path.startsWith("/reglages")) return null;
  return (
    <div className="no-print mx-auto w-full max-w-[1400px] px-4 pt-4 md:px-8">
      <Link href="/reglages" className="flex items-center gap-3 rounded-2xl bg-warn-bg px-4 py-3 text-sm font-semibold text-warn hover:opacity-90">
        <CloudOff size={18} className="shrink-0" />
        <span>Cet appareil n&apos;est pas connecté à la synchro : tes données ne se mettent pas à jour avec tes autres appareils. Touche ici pour te connecter.</span>
      </Link>
    </div>
  );
}
