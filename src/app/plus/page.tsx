"use client";
import Link from "next/link";
import { ChevronRight, Inbox, Settings, BarChart3 } from "lucide-react";
import { mainNav } from "@/components/nav";
import { PageHeader } from "@/components/ui";

const extra = [
  { href: "/clients/demandes", label: "Demandes clients", icon: Inbox },
  { href: "/clients/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/reglages", label: "Réglages et synchro", icon: Settings },
];

export default function Plus() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Stack", href: "/" }, { label: "Plus" }]} title="Tout Stack" />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {[...mainNav.slice(4), ...extra].map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 font-semibold transition-colors hover:bg-muted">
              <span className="flex size-9 items-center justify-center rounded-xl bg-azure text-azure-text"><Icon size={18} /></span>
              <span className="flex-1">{label}</span>
              <ChevronRight size={16} className="text-ink-2" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
