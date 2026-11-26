"use client";
import { useShallow } from "zustand/react/shallow";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, FolderPlus, Pencil, Trash2, X } from "lucide-react";
import { categoryList, NO_CATEGORY, useStack, type CategoryKind } from "@/lib/store";
import { Button, Field, Modal, inputCls } from "./ui";

/** Category dropdown for a form, with "+ Nouvelle catégorie" to create one on the spot. */
export function CategoryPicker({ kind, value, onChange }: { kind: CategoryKind; value: string; onChange: (v: string) => void }) {
  const list = useStack(useShallow((s) => categoryList(kind, s)));
  const addCategory = useStack((s) => s.addCategory);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const create = () => {
    const n = name.trim();
    if (!n) return setCreating(false);
    addCategory(kind, n);
    onChange(list.find((c) => c.toLowerCase() === n.toLowerCase()) ?? n);
    setName("");
    setCreating(false);
  };
  return (
    <Field label="Catégorie">
      {creating ? (
        <div className="flex gap-2">
          <input
            className={inputCls}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); create(); } if (e.key === "Escape") setCreating(false); }}
            placeholder="Ex. Clients, Perso, Outils dev"
          />
          <Button type="button" variant="primary" onClick={create} aria-label="Créer la catégorie"><Check size={16} /></Button>
          <Button type="button" onClick={() => setCreating(false)} aria-label="Annuler"><X size={16} /></Button>
        </div>
      ) : (
        <select className={inputCls} value={value} onChange={(e) => (e.target.value === "__new" ? setCreating(true) : onChange(e.target.value))}>
          <option value="">{NO_CATEGORY}</option>
          {list.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__new">+ Nouvelle catégorie…</option>
        </select>
      )}
    </Field>
  );
}

/** Button + modal to create, rename, reorder and delete categories. */
export function CategoryManager({ kind }: { kind: CategoryKind }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}><FolderPlus size={16} /> Catégories</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={kind === "apps" ? "Catégories d'applis" : "Catégories de raccourcis"}>
        <CategoryList kind={kind} />
        <div className="mt-5 flex justify-end"><Button variant="primary" onClick={() => setOpen(false)}>Terminé</Button></div>
      </Modal>
    </>
  );
}

function CategoryList({ kind }: { kind: CategoryKind }) {
  const st = useStack();
  const list = categoryList(kind, st);
  const items = kind === "shortcuts" ? st.shortcuts.map((x) => x.group) : st.apps.map((x) => x.category);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const add = () => { st.addCategory(kind, name); setName(""); };
  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle catégorie" />
        <Button variant="primary" disabled={!name.trim()}>Ajouter</Button>
      </form>
      {!list.length && <p className="text-sm text-ink-2">Aucune catégorie pour l&apos;instant.</p>}
      <ul className="divide-y divide-line rounded-xl border border-line">
        {list.map((c, i) => {
          const count = items.filter((x) => x === c).length;
          return (
            <li key={c} className="flex items-center gap-2 px-3 py-2">
              {editing === c ? (
                <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); st.renameCategory(kind, c, draft); setEditing(null); }}>
                  <input className={inputCls} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setEditing(null)} />
                  <Button variant="primary" aria-label="Valider"><Check size={15} /></Button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c} <span className="font-normal text-ink-2">· {count}</span></span>
                  <button className="rounded-lg p-1.5 text-ink-2 hover:bg-muted hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => st.moveCategory(kind, c, -1)} aria-label={`Monter ${c}`}><ArrowUp size={15} /></button>
                  <button className="rounded-lg p-1.5 text-ink-2 hover:bg-muted hover:text-ink disabled:opacity-30" disabled={i === list.length - 1} onClick={() => st.moveCategory(kind, c, 1)} aria-label={`Descendre ${c}`}><ArrowDown size={15} /></button>
                  <button className="rounded-lg p-1.5 text-ink-2 hover:bg-muted hover:text-ink" onClick={() => { setEditing(c); setDraft(c); }} aria-label={`Renommer ${c}`}><Pencil size={15} /></button>
                  <button className="rounded-lg p-1.5 text-ink-2 hover:bg-down-bg hover:text-down" onClick={() => st.removeCategory(kind, c)} aria-label={`Supprimer ${c}`} title={count ? `Les ${count} éléments passent dans « ${NO_CATEGORY} »` : undefined}><Trash2 size={15} /></button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {list.length > 0 && <p className="text-xs text-ink-2">Supprimer une catégorie ne supprime rien d&apos;autre : ses éléments passent dans « {NO_CATEGORY} ».</p>}
    </div>
  );
}
