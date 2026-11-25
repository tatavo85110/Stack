"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Plus, Upload, Trash2, Pencil, Globe } from "lucide-react";
import { useStack } from "@/lib/store";
import type { Shortcut } from "@/lib/types";
import { Button, Field, Modal, PageHeader, inputCls } from "@/components/ui";
import { ShortcutIcon } from "@/components/blocks";
import { initialsOf } from "@/lib/format";

const COLORS = ["#0b1f3a", "#15325a", "#1d5fd8", "#2f7fd0", "#5aa7e6", "#1b6aa5"];

/** Reads an image file and returns a small square PNG data URL (keeps localStorage light). */
async function fileToIcon(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const r = Math.min(128 / img.width, 128 / img.height);
    const w = img.width * r, h = img.height * r;
    ctx.drawImage(img, (128 - w) / 2, (128 - h) / 2, w, h);
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ShortcutForm({ initial, groups, onDone }: { initial?: Shortcut; groups: string[]; onDone: () => void }) {
  const { addShortcut, updateShortcut, removeShortcut } = useStack();
  const [url, setUrl] = useState(initial?.url ?? "https://");
  const [name, setName] = useState(initial?.name ?? "");
  const [group, setGroup] = useState(initial?.group ?? groups[0] ?? "Général");
  const [icon, setIcon] = useState<string | undefined>(initial?.icon);
  const [color, setColor] = useState(initial?.color ?? COLORS[2]);
  const [mode, setMode] = useState<"file" | "initials">(initial?.icon ? "file" : initial ? "initials" : "file");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const preview: Shortcut = { id: "p", name: name || "Nom", url, group, icon: mode === "file" ? icon : undefined, initials: initialsOf(name || "?"), color };

  const onFile = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && !/\.(ico|svg|png|jpe?g|webp)$/i.test(f.name)) return setError("Choisis une image (.ico, .png, .svg, .jpg).");
    try {
      setIcon(await fileToIcon(f));
      setMode("file");
      setError("");
    } catch {
      setError("Cette image n'a pas pu être lue. Essaie un .png.");
    }
  };

  const save = () => {
    if (!name.trim()) return setError("Donne un nom au raccourci.");
    if (!/^https?:\/\/.+\..+/.test(url)) return setError("L'adresse doit commencer par https:// et contenir un domaine.");
    const data = { name: name.trim(), url: url.trim(), group: group.trim() || "Général", icon: mode === "file" ? icon : undefined, initials: initialsOf(name), color };
    if (initial) updateShortcut(initial.id, data);
    else addShortcut(data);
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
        <ShortcutIcon s={preview} size={48} />
        <div className="min-w-0">
          <p className="truncate font-bold">{preview.name}</p>
          <p className="truncate text-xs text-ink-2">{url.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>
      <Field label="Adresse">
        <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} onBlur={() => !name && url.includes(".") && setName(url.replace(/^https?:\/\/(www\.)?/, "").split(/[./]/)[0].replace(/^./, (c) => c.toUpperCase()))} />
      </Field>
      <Field label="Nom">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Banque" />
      </Field>
      <Field label="Groupe">
        <input className={inputCls} list="groups" value={group} onChange={(e) => setGroup(e.target.value)} />
        <datalist id="groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
      </Field>
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-ink-2">Icône</span>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className={clsx("flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors", mode === "file" ? "border-bright bg-azure text-azure-text" : "border-line-strong hover:border-bright")}>
            <Upload size={15} /> Importer un favicon
          </button>
          <button type="button" onClick={() => setMode("initials")} className={clsx("rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors", mode === "initials" ? "border-bright bg-azure text-azure-text" : "border-line-strong hover:border-bright")}>
            Initiales + couleur
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,.ico" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
          className="mt-2 rounded-xl border border-dashed border-line-strong p-3 text-center text-xs text-ink-2"
        >
          ou glisse un fichier .ico, .png ou .svg ici
        </div>
        {mode === "initials" && (
          <div className="mt-3 flex gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={c} onClick={() => setColor(c)} className={clsx("size-8 rounded-lg transition-transform hover:scale-110", color === c && "ring-2 ring-bright ring-offset-2 ring-offset-surface")} style={{ background: c }} />
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm font-semibold text-down">{error}</p>}
      <div className="flex gap-2 pt-2">
        {initial && (
          <Button variant="ghost" className="text-down" onClick={() => { removeShortcut(initial.id); onDone(); }}>
            <Trash2 size={15} /> Supprimer
          </Button>
        )}
        <Button className="ml-auto" onClick={onDone}>Annuler</Button>
        <Button variant="primary" onClick={save}>Enregistrer</Button>
      </div>
    </div>
  );
}

function Shortcuts() {
  const shortcuts = useStack((s) => s.shortcuts);
  const params = useSearchParams();
  const [editing, setEditing] = useState<Shortcut | "new" | null>(null);
  useEffect(() => {
    if (params.get("ajout")) setEditing("new");
  }, [params]);
  const groups = [...new Set(shortcuts.map((s) => s.group))];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Stack", href: "/" }, { label: "Raccourcis" }]}
        title="Raccourcis"
        actions={<Button variant="primary" onClick={() => setEditing("new")}><Plus size={16} /> Ajouter un raccourci</Button>}
      />
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-3 text-sm font-bold text-ink-2">{g}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {shortcuts.filter((s) => s.group === g).map((s) => (
                <div key={s.id} className="group relative">
                  <a href={s.url} target="_blank" rel="noreferrer" className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-[box-shadow,transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-bright hover:shadow-lg">
                    <ShortcutIcon s={s} size={44} />
                    <span>
                      <span className="block truncate font-bold">{s.name}</span>
                      <span className="flex items-center gap-1 truncate text-xs text-ink-2"><Globe size={11} />{s.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</span>
                    </span>
                  </a>
                  <button onClick={() => setEditing(s)} aria-label={`Modifier ${s.name}`} className="absolute top-3 right-3 rounded-lg bg-surface p-1.5 text-ink-2 opacity-0 shadow transition-opacity group-hover:opacity-100 hover:text-bright focus:opacity-100">
                    <Pencil size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
        <button onClick={() => setEditing("new")} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong p-6 font-semibold text-ink-2 transition-colors hover:border-bright hover:text-bright">
          <Plus size={18} /> Nouveau raccourci
        </button>
      </div>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nouveau raccourci" : "Modifier le raccourci"}>
        {editing !== null && <ShortcutForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} groups={groups} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Shortcuts />
    </Suspense>
  );
}
