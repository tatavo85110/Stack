/**
 * Parses an Indy export (CSV, semicolon or comma separated) into invoice rows.
 * Indy has no public API, so revenue comes from its exports. Column names are matched loosely
 * because the exact export format has not been confirmed yet.
 */
export interface ParsedRow { date: string; client: string; amount: number }

const DATE_KEYS = ["date", "date de facture", "date d'emission", "date d'encaissement", "date de paiement"];
const CLIENT_KEYS = ["client", "nom du client", "tiers", "destinataire", "libelle", "libellé"];
const AMOUNT_KEYS = ["montant ttc", "montant", "total ttc", "total", "montant ht", "total ht", "recette", "encaissement"];

const clean = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/["']/g, "'").trim();

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (ch === sep && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function toIso(v: string): string | null {
  const s = v.trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) { const y = m[3].length === 2 ? `20${m[3]}` : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function toNumber(v: string): number | null {
  const s = v.replace(/[€\s ]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function parseIndyCsv(text: string): { rows: ParsedRow[]; columns: { date?: string; client?: string; amount?: string }; errors: number } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], columns: {}, errors: 0 };
  const sep = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const header = splitLine(lines[0], sep).map(clean);
  const find = (keys: string[]) => {
    for (const k of keys) { const i = header.findIndex((h) => h === clean(k)); if (i >= 0) return i; }
    for (const k of keys) { const i = header.findIndex((h) => h.includes(clean(k))); if (i >= 0) return i; }
    return -1;
  };
  const di = find(DATE_KEYS), ci = find(CLIENT_KEYS), ai = find(AMOUNT_KEYS);
  const raw = splitLine(lines[0], sep);
  const columns = { date: raw[di], client: raw[ci], amount: raw[ai] };
  if (di < 0 || ci < 0 || ai < 0) return { rows: [], columns, errors: lines.length - 1 };
  const rows: ParsedRow[] = [];
  let errors = 0;
  for (const l of lines.slice(1)) {
    const c = splitLine(l, sep);
    const date = toIso(c[di] ?? ""), amount = toNumber(c[ai] ?? ""), client = (c[ci] ?? "").trim();
    if (date && amount !== null && amount > 0 && client) rows.push({ date, client, amount });
    else errors++;
  }
  return { rows, columns, errors };
}
