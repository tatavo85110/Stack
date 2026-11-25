"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Search, Moon, Sun, ExternalLink, Settings } from "lucide-react";
import { LogoIcon } from "./Logo";
import { mainNav, mobileNav, topTabs, isActive, PUBLIC_PAGES } from "./nav";
import { useMonitor } from "@/lib/monitor";
import { useCloudSync } from "@/lib/sync";
import { CommandPalette } from "./CommandPalette";
import { useStack, useHydrated } from "@/lib/store";
import { INDY_URL } from "@/lib/format";
import { TimerBar } from "./TimerBar";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (PUBLIC_PAGES.some((p) => path.startsWith(p))) return <PublicShell>{children}</PublicShell>;
  return <Cockpit path={path}>{children}</Cockpit>;
}

function PublicShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  return <main className="mx-auto min-h-dvh w-full max-w-4xl px-4 py-8 md:py-12">{hydrated ? children : null}</main>;
}

function Cockpit({ children, path }: { children: ReactNode; path: string }) {
  const [cmd, setCmd] = useState(false);
  const theme = useStack((s) => s.theme);
  const toggleTheme = useStack((s) => s.toggleTheme);
  const hydrated = useHydrated();
  useMonitor();
  useCloudSync();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if ("serviceWorker" in navigator && location.hostname !== "localhost") navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js`).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-dvh print:block">
      {/* Sidebar (desktop) */}
      <aside className="no-print sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-2 bg-night py-5 md:flex">
        <Link href="/" className="mb-4 transition-transform hover:scale-105" aria-label="Accueil Stack">
          <LogoIcon size={42} />
        </Link>
        {mainNav.map(({ href, label, icon: Icon }) => {
          const on = href === "/clients" ? path.startsWith("/clients") : isActive(href, path);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={clsx(
                "group relative flex size-11 items-center justify-center rounded-xl transition-colors duration-150",
                on ? "bg-sky text-night" : "text-[#a9bdd8] hover:bg-night-2 hover:text-white",
              )}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="pointer-events-none absolute left-14 z-20 rounded-lg bg-night px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
        <div className="mt-auto flex flex-col items-center gap-2">
          <a href={INDY_URL} target="_blank" rel="noreferrer" title="Ouvrir Indy" className="flex size-11 items-center justify-center rounded-xl bg-bright text-xs font-extrabold text-white transition-transform hover:scale-105">
            IN
          </a>
          <Link href="/reglages" title="Réglages" aria-label="Réglages" className={clsx("flex size-11 items-center justify-center rounded-xl transition-colors", path.startsWith("/reglages") ? "bg-sky text-night" : "text-[#a9bdd8] hover:bg-night-2 hover:text-white")}>
            <Settings size={20} />
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-page/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 md:px-8">
            <Link href="/" className="md:hidden">
              <LogoIcon size={34} />
            </Link>
            <nav className="hidden items-center gap-1 rounded-2xl border border-line bg-surface p-1 shadow-card md:flex">
              {topTabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={clsx(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-150",
                    isActive(t.href, path) ? "bg-night text-white dark:bg-bright" : "text-ink-2 hover:bg-muted hover:text-ink",
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={() => setCmd(true)}
              className="ml-auto flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-2 shadow-card transition-colors hover:border-bright md:w-80"
              aria-label="Rechercher"
            >
              <Search size={16} />
              <span className="hidden flex-1 text-left md:inline">Rechercher un client, une appli…</span>
              <kbd className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold md:inline">⌘K</kbd>
            </button>
            <button onClick={toggleTheme} className="rounded-xl border border-line bg-surface p-2 text-ink-2 shadow-card transition-colors hover:text-ink" aria-label="Changer de thème">
              {hydrated && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/reglages" className="rounded-xl border border-line bg-surface p-2 text-ink-2 shadow-card transition-colors hover:text-ink md:hidden" aria-label="Réglages">
              <Settings size={18} />
            </Link>
            <a href={INDY_URL} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-xl bg-azure px-3 py-2 text-sm font-semibold text-azure-text transition-colors hover:bg-sky hover:text-night lg:flex">
              Indy <ExternalLink size={14} />
            </a>
          </div>
        </header>

        <div className="no-print"><TimerBar /></div>
        <main key={path} className="page-enter mx-auto w-full max-w-[1400px] flex-1 px-4 pt-6 pb-28 md:px-8 md:pb-12">
          {hydrated ? children : <div className="h-96 animate-pulse rounded-2xl bg-muted" />}
        </main>
      </div>

      {/* Bottom bar (mobile) */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md justify-around px-2 py-2">
          {mobileNav.map(({ href, label, icon: Icon }) => {
            const on = href === "/clients" ? path.startsWith("/clients") : isActive(href, path);
            return (
              <Link key={href} href={href} className={clsx("flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-colors", on ? "text-bright" : "text-ink-2")}>
                <span className={clsx("flex h-7 w-12 items-center justify-center rounded-full transition-colors", on && "bg-azure")}>
                  <Icon size={19} />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  );
}
