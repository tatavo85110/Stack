"use client";
import Link from "next/link";
import clsx from "clsx";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import type { AppStatus } from "@/lib/types";

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={clsx("min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-card", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

type Variant = "primary" | "secondary" | "accent" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-night text-white hover:bg-bright active:bg-night-2 dark:bg-bright dark:hover:bg-mid",
  secondary: "border border-line-strong bg-surface text-ink hover:border-bright hover:bg-muted active:bg-azure",
  accent: "bg-sky text-night hover:bg-azure active:bg-mid active:text-white",
  ghost: "text-ink-2 hover:bg-muted hover:text-ink",
};
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-[background,box-shadow,border-color,color] duration-150 hover:shadow-md active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bright disabled:opacity-50";

export function Button({ variant = "secondary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={clsx(base, variants[variant], className)} {...p} />;
}
export function ButtonLink({ variant = "secondary", className, href, external, children }: { variant?: Variant; className?: string; href: string; external?: boolean; children: ReactNode }) {
  if (external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={clsx(base, variants[variant], className)}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={clsx(base, variants[variant], className)}>
      {children}
    </Link>
  );
}

const pill: Record<string, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  down: "bg-down-bg text-down",
  info: "bg-azure text-azure-text",
  neutral: "bg-muted text-ink-2",
};
export function Pill({ tone = "neutral", children, dot }: { tone?: keyof typeof pill; children: ReactNode; dot?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", pill[tone])}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
export const statusLabel: Record<AppStatus, string> = { ok: "En ligne", warn: "Alerte", down: "Hors ligne" };
export function Status({ s }: { s: AppStatus }) {
  return (
    <Pill tone={s} dot>
      {statusLabel[s]}
    </Pill>
  );
}

export function Kpi({ label, value, hint, tone = "azure" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "azure" | "ice" | "night" | "plain" }) {
  const tones = { azure: "bg-azure", ice: "bg-ice", night: "bg-night text-white", plain: "bg-surface border border-line" };
  return (
    <div className={clsx("rounded-2xl p-4", tones[tone])}>
      <p className={clsx("text-xs font-semibold", tone === "night" ? "text-sky" : "text-ink-2")}>{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className={clsx("mt-1 text-xs", tone === "night" ? "text-white/70" : "text-ink-2")}>{hint}</p>}
    </div>
  );
}

export function PageHeader({ crumbs, title, actions }: { crumbs: { label: string; href?: string }[]; title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <nav className="text-xs font-medium text-ink-2">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5">›</span>}
              {c.href ? (
                <Link className="hover:text-bright" href={c.href}>
                  {c.label}
                </Link>
              ) : (
                c.label
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string; href?: string }[]; value: T; onChange?: (v: T) => void }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-muted p-1">
      {options.map((o) => {
        const cls = clsx("shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors", o.value === value ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink");
        return o.href ? (
          <Link key={o.value} href={o.href} className={cls}>
            {o.label}
          </Link>
        ) : (
          <button key={o.value} className={cls} onClick={() => onChange?.(o.value)}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ text, className, color }: { text: string; className?: string; color?: string }) {
  return (
    <span
      className={clsx("inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white", !color && "bg-night-2", className)}
      style={color ? { background: color } : undefined}
    >
      {text}
    </span>
  );
}

export function Progress({ value, tone = "bright" }: { value: number; tone?: "bright" | "warn" | "down" }) {
  const c = { bright: "bg-bright", warn: "bg-warn", down: "bg-down" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={clsx("h-full rounded-full transition-[width] duration-500", c)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-snug text-ink-2/80">{hint}</span>}
    </label>
  );
}
export const inputCls =
  "w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-bright focus:ring-2 focus:ring-bright/20";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  // Rendered on <body>: the page's enter animation would otherwise trap the modal under the mobile bottom bar.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-night/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-slide-up relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <h2 className="mb-5 text-lg font-extrabold">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-ink-2">{children}</p>;
}
