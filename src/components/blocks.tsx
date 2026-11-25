"use client";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Check, Plus, X } from "lucide-react";
import type { App, Shortcut } from "@/lib/types";
import { useStack } from "@/lib/store";
import { Status } from "./ui";
import { initialsOf } from "@/lib/format";

export function ShortcutIcon({ s, size = 40 }: { s: Shortcut; size?: number }) {
  return s.icon ? (
    // eslint-disable-next-line @next/next/no-img-element -- favicons are local data URLs
    <img src={s.icon} alt="" width={size} height={size} className="shrink-0 rounded-xl border border-line bg-white object-contain p-1.5" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white" style={{ width: size, height: size, background: s.color }}>
      {s.initials}
    </span>
  );
}

export function AppIcon({ app, size = 36 }: { app: Pick<App, "name" | "icon">; size?: number }) {
  const [broken, setBroken] = useState("");
  return app.icon && broken !== app.icon ? (
    // eslint-disable-next-line @next/next/no-img-element -- favicons are data URLs or tiny remote icons
    <img src={app.icon} alt="" onError={() => setBroken(app.icon!)} width={size} height={size} className="shrink-0 rounded-xl border border-line bg-white object-contain p-1" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-xl bg-azure text-xs font-bold text-azure-text" style={{ width: size, height: size }}>{initialsOf(app.name)}</span>
  );
}

export function AppRow({ app }: { app: App }) {
  const client = useStack((s) => s.clients.find((c) => c.id === app.clientId));
  return (
    <Link href={`/applis/fiche?id=${app.id}`} className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-[border-color,background,box-shadow] duration-150 hover:border-bright hover:bg-muted/60 hover:shadow-sm">
      <AppIcon app={app} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{app.name}</span>
        <span className="block truncate text-xs text-ink-2">{client?.name ?? "Perso"} · {app.host}</span>
      </span>
      <Status s={app.status} />
    </Link>
  );
}

export function TodoList({ compact }: { compact?: boolean }) {
  const { todos, toggleTodo, addTodo, removeTodo } = useStack();
  const [text, setText] = useState("");
  return (
    <div>
      <ul className="space-y-1">
        {todos.map((t) => (
          <li key={t.id} className="group flex items-center gap-3 rounded-lg px-1 py-1.5">
            <button
              onClick={() => toggleTodo(t.id)}
              aria-label={t.done ? "Décocher" : "Cocher"}
              className={clsx(
                "flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all duration-200",
                t.done ? "scale-100 border-bright bg-bright text-white" : "border-line-strong hover:border-bright active:scale-90",
              )}
            >
              <Check size={13} strokeWidth={3} className={clsx("transition-all duration-200", t.done ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
            </button>
            <span className={clsx("flex-1 text-sm transition-colors", t.done && "text-ink-2 line-through")}>{t.label}</span>
            <button onClick={() => removeTodo(t.id)} className="text-ink-2 opacity-0 transition-opacity group-hover:opacity-100 hover:text-down" aria-label="Supprimer">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      {!compact && (
        <form
          className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-line-strong px-2 py-1.5 focus-within:border-bright"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) addTodo(text.trim());
            setText("");
          }}
        >
          <Plus size={15} className="text-ink-2" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ajouter une tâche" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-2" />
        </form>
      )}
    </div>
  );
}
