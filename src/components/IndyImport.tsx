"use client";
import { useRef, useState } from "react";
import { FileUp, CheckCircle2 } from "lucide-react";
import { useStack } from "@/lib/store";
import { parseIndyCsv, type ParsedRow } from "@/lib/indy";
import { Button, Modal } from "./ui";
import { eur, INDY_URL } from "@/lib/format";

export function IndyImportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}><FileUp size={16} /> Importer depuis Indy</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Importer un export Indy">
        <IndyImport onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function IndyImport({ onDone }: { onDone: () => void }) {
  const importInvoices = useStack((s) => s.importInvoices);
  const lastImport = useStack((s) => s.lastImport);
  const ref = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [info, setInfo] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const read = async (f?: File) => {
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name)) { setInfo("Exporte le fichier au format CSV depuis Indy (pas Excel), puis réessaie."); return; }
    const text = await f.text();
    const r = parseIndyCsv(text);
    if (!r.rows.length) {
      setRows(null);
      setInfo(`Je n'ai pas reconnu les colonnes. Il faut une colonne date, une colonne client et une colonne montant. Colonnes trouvées : ${Object.values(r.columns).filter(Boolean).join(", ") || "aucune"}.`);
      return;
    }
    setRows(r.rows);
    setInfo(`Colonnes utilisées : ${r.columns.date} · ${r.columns.client} · ${r.columns.amount}${r.errors ? ` (${r.errors} lignes ignorées)` : ""}`);
  };

  if (result) return (
    <div className="space-y-4 text-center">
      <CheckCircle2 className="mx-auto text-ok" size={40} />
      <p className="font-semibold">{result}</p>
      <Button variant="primary" onClick={onDone}>Terminer</Button>
    </div>
  );

  return (
    <div className="space-y-4 text-sm">
      <ol className="list-decimal space-y-1 pl-5 text-ink-2">
        <li>Dans <a className="font-semibold text-bright" href={INDY_URL} target="_blank" rel="noreferrer">Indy</a>, exporte tes factures ou ton livre des recettes en CSV.</li>
        <li>Glisse le fichier ci-dessous. Les factures déjà importées sont ignorées.</li>
      </ol>
      <button
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); read(e.dataTransfer.files[0]); }}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line-strong p-8 text-ink-2 transition-colors hover:border-bright hover:text-bright"
      >
        <FileUp size={28} />
        <span className="font-semibold">Choisir ou glisser le fichier CSV</span>
      </button>
      <input ref={ref} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
      {info && <p className="rounded-xl bg-muted p-3 text-xs text-ink-2">{info}</p>}
      {rows && (
        <div className="rounded-xl border border-line">
          <p className="border-b border-line px-3 py-2 text-xs font-semibold">{rows.length} factures, {eur(rows.reduce((a, r) => a + r.amount, 0))} au total</p>
          <ul className="max-h-40 divide-y divide-line overflow-y-auto">
            {rows.slice(0, 30).map((r, i) => (
              <li key={i} className="flex justify-between px-3 py-1.5 text-xs"><span>{r.date} · {r.client}</span><b>{eur(r.amount)}</b></li>
            ))}
          </ul>
        </div>
      )}
      {lastImport && <p className="text-xs text-ink-2">Dernier import : {new Date(lastImport).toLocaleString("fr-FR")}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Annuler</Button>
        <Button variant="primary" disabled={!rows} onClick={() => {
          const r = importInvoices(rows!);
          const pl = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
          setResult(`${pl(r.added, "facture ajoutée", "factures ajoutées")}${r.skipped ? `, ${pl(r.skipped, "déjà présente", "déjà présentes")}` : ""}${r.newClients ? `, ${pl(r.newClients, "nouveau client", "nouveaux clients")}` : ""}.`);
        }}>Importer</Button>
      </div>
    </div>
  );
}
