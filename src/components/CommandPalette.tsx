"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Search, Play, ExternalLink, Plus, Moon, BarChart3 } from "lucide-react";
import { useStack } from "@/lib/store";
import { INDY_URL, initialsOf } from "@/lib/format";

interface Item { id: string; group: string; label: string; hint?: string; badge: React.ReactNode; run: () => void }

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { clients, apps, projects, shortcuts, startTimer, toggleTheme, addTodo } = useStack();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => { router.push(href); onClose(); };
    const ext = (url: string) => () => { window.open(url, "_blank", "noopener"); onClose(); };
    const badge = (t: string) => <span className="flex size-8 items-center justify-center rounded-lg bg-night-2 text-[11px] font-bold text-white">{t}</span>;
    const icon = (I: typeof Play) => <span className="flex size-8 items-center justify-center rounded-lg bg-azure text-azure-text"><I size={16} /></span>;
    const doing = projects.find((p) => p.column === "doing");
    const all: Item[] = [
      ...clients.map((c) => ({ id: "c" + c.id, group: "Clients", label: c.name, hint: c.stage, badge: badge(initialsOf(c.name)), run: go(`/clients/fiche?id=${c.id}`) })),
      ...apps.map((a) => ({ id: "a" + a.id, group: "Applis", label: a.name, hint: a.url.replace(/^https?:\/\//, ""), badge: a.icon ? <img src={a.icon} alt="" className="size-8 rounded-lg bg-white object-contain p-1" /> : badge(initialsOf(a.name)), run: go(`/applis/fiche?id=${a.id}`) })),
      ...projects.map((p) => ({ id: "p" + p.id, group: "Projets", label: p.title, hint: clients.find((c) => c.id === p.clientId)?.name ?? "Perso", badge: badge(initialsOf(p.title)), run: go(`/projets`) })),
      ...shortcuts.map((s) => ({
        id: "s" + s.id, group: "Raccourcis", label: s.name, hint: s.url.replace(/^https?:\/\//, ""),
        // eslint-disable-next-line @next/next/no-img-element
        badge: s.icon ? <img src={s.icon} alt="" className="size-8 rounded-lg bg-white object-contain p-1" /> : badge(s.initials), run: ext(s.url),
      })),
      { id: "x1", group: "Actions", label: q.trim() ? `Nouvelle tâche : « ${q.trim()} »` : "Nouvelle tâche du jour", badge: icon(Plus), run: () => { addTodo(q.trim() || "Nouvelle tâche"); router.push("/"); onClose(); } },
      ...(doing ? [{ id: "x2", group: "Actions", label: `Lancer le chrono sur « ${doing.title} »`, badge: icon(Play), run: () => { startTimer(doing.id, doing.title); onClose(); } }] : []),
      { id: "x3", group: "Actions", label: "Ouvrir Indy", hint: "Factures, devis, compta", badge: icon(ExternalLink), run: ext(INDY_URL) },
      { id: "x4", group: "Actions", label: "Voir les statistiques", badge: icon(BarChart3), run: go("/clients/stats") },
      { id: "x5", group: "Actions", label: "Changer de thème (clair / sombre)", badge: icon(Moon), run: () => { toggleTheme(); onClose(); } },
    ];
    const n = norm(q.trim());
    if (!n) return all.filter((i) => i.group !== "Projets" && i.group !== "Raccourcis").slice(0, 4).concat(all.filter((i) => i.group === "Actions"));
    return all.filter((i) => i.group === "Actions" || norm(i.label + " " + (i.hint ?? "")).includes(n)).slice(0, 12);
  }, [q, clients, apps, projects, shortcuts, router, onClose, startTimer, toggleTheme, addTodo]);

  useEffect(() => setSel(0), [q]);

  if (!open) return null;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter") items[sel]?.run();
  };
  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKey}>
      <div className="animate-fade absolute inset-0 bg-night/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-pop relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl" role="dialog" aria-label="Recherche">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search size={18} className="text-ink-2" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client, une appli, une action…" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-2" />
          <kbd className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink-2">Échap</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2">
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.id}>
                {head && <p className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-ink-2 uppercase">{head}</p>}
                <button
                  onMouseEnter={() => setSel(i)}
                  onClick={it.run}
                  className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors", i === sel ? "bg-azure" : "hover:bg-muted")}
                >
                  {it.badge}
                  <span className="flex-1 truncate text-sm font-semibold">{it.label}</span>
                  {it.hint && <span className="truncate text-xs text-ink-2">{it.hint}</span>}
                </button>
              </li>
            );
          })}
          {!items.length && <li className="p-6 text-center text-sm text-ink-2">Aucun résultat</li>}
        </ul>
        <div className="flex gap-4 border-t border-line px-5 py-2.5 text-[11px] text-ink-2">
          <span>↑↓ naviguer</span>
          <span>↵ ouvrir</span>
          <span>Échap fermer</span>
        </div>
      </div>
    </div>
  );
}
