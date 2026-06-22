import type { ParsedBankRow, ColMapping, BankDirection } from "../domain/bankMovement";

// ── Bancos conocidos y sus patrones de detección ──────────────────────────────
const KNOWN_BANKS: { name: string; patterns: string[] }[] = [
  { name: "BancoEstado",    patterns: ["bancoestado", "banco estado"] },
  { name: "BancoBCI",       patterns: ["bci", "banco bci"] },
  { name: "BancoSantander", patterns: ["santander"] },
  { name: "BancoChile",     patterns: ["banco de chile", "bancochile"] },
  { name: "BancoFalabella", patterns: ["falabella"] },
  { name: "BancoItau",      patterns: ["itau", "itaú"] },
  { name: "BancoScotia",    patterns: ["scotiabank", "scotbank"] },
  { name: "BancoSecurity",  patterns: ["security"] },
  { name: "BancoRipley",    patterns: ["ripley"] },
  { name: "BancoConsorcio", patterns: ["consorcio"] },
];

export function detectBankFromHeaders(headers: string[], firstRows: string[][]): string {
  const content = [...headers, ...firstRows.flat()].join(" ").toLowerCase();
  for (const bank of KNOWN_BANKS) {
    if (bank.patterns.some(p => content.includes(p))) return bank.name;
  }
  return "BancoGenérico";
}

// ── Parseo de fecha en formatos chilenos comunes ──────────────────────────────
function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const clean = raw.trim();

  // dd/mm/yyyy or dd-mm-yyyy
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}T00:00:00Z`);

  // yyyy-mm-dd
  const ymd = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}T00:00:00Z`);

  // dd.mm.yyyy
  const dot = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dot) return new Date(`${dot[3]}-${dot[2].padStart(2,"0")}-${dot[1].padStart(2,"0")}T00:00:00Z`);

  const attempt = new Date(clean);
  return isNaN(attempt.getTime()) ? null : attempt;
}

// ── Parseo de número chileno: "1.234.567,89" o "1234567.89" ──────────────────
function parseAmount(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const clean = raw.trim()
    .replace(/\s/g, "")
    .replace(/[$CLP%]/gi, "");

  // Formato chileno: 1.234.567,89
  const chilean = clean.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(chilean);
  return isNaN(n) ? null : Math.abs(n);
}

// ── Inferir dirección si no hay columnas separadas ────────────────────────────
function inferDirection(row: Record<string, string>, mapping: ColMapping): { amount: number; direction: BankDirection } | null {
  if (mapping.colDebit && mapping.colCredit) {
    const debit  = parseAmount(row[mapping.colDebit]  ?? "");
    const credit = parseAmount(row[mapping.colCredit] ?? "");
    if (credit != null && credit > 0) return { amount: credit, direction: "INFLOW"  };
    if (debit  != null && debit  > 0) return { amount: debit,  direction: "OUTFLOW" };
    return null;
  }

  if (mapping.colAmount) {
    const raw    = row[mapping.colAmount] ?? "";
    const amount = parseAmount(raw);
    if (amount == null) return null;
    // Negative value or "−" prefix = outflow
    const isNeg = raw.trim().startsWith("-") || raw.trim().startsWith("−");
    return { amount, direction: isNeg ? "OUTFLOW" : "INFLOW" };
  }

  return null;
}

// ── Separar CSV respetando comillas ──────────────────────────────────────────
function splitCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === sep && !inQuote) {
      result.push(current.trim().replace(/^"+|"+$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"+|"+$/g, ""));
  return result;
}

// ── Detectar separador ───────────────────────────────────────────────────────
function detectSeparator(firstLine: string): string {
  const counts = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const sep of Object.keys(counts) as (keyof typeof counts)[]) {
    counts[sep] = (firstLine.match(new RegExp(`\\${sep}`, "g")) ?? []).length;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Auto-detectar mapping desde encabezados ──────────────────────────────────
export function autoDetectMapping(headers: string[]): Partial<ColMapping> {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const mapping: Partial<ColMapping> = {};

  for (const h of headers) {
    const n = norm(h);
    if (!mapping.colDate && (n.includes("fecha") || n.includes("date"))) {
      mapping.colDate = h;
    }
    if (!mapping.colDesc && (n.includes("desc") || n.includes("glosa") || n.includes("concepto") || n.includes("detail"))) {
      mapping.colDesc = h;
    }
    if (!mapping.colBalance && (n.includes("saldo") || n.includes("balance"))) {
      mapping.colBalance = h;
    }
    if (!mapping.colDebit && (n.includes("cargo") || n.includes("debito") || n.includes("debit") || n.includes("egreso"))) {
      mapping.colDebit = h;
    }
    if (!mapping.colCredit && (n.includes("abono") || n.includes("credito") || n.includes("credit") || n.includes("ingreso"))) {
      mapping.colCredit = h;
    }
    if (!mapping.colAmount && !mapping.colDebit && !mapping.colCredit && (n.includes("monto") || n.includes("amount") || n.includes("valor"))) {
      mapping.colAmount = h;
    }
  }

  return mapping;
}

// ── Parser principal ─────────────────────────────────────────────────────────
export interface ParseBankCsvResult {
  rows:          ParsedBankRow[];
  headers:       string[];
  detectedBank:  string;
  suggestedMapping: Partial<ColMapping>;
  errors:        string[];
  separator:     string;
}

export function parseBankCsv(csvText: string, mapping?: ColMapping): ParseBankCsvResult {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], headers: [], detectedBank: "Desconocido", suggestedMapping: {}, errors: ["El archivo está vacío o tiene solo encabezados."], separator: "," };
  }

  const separator       = detectSeparator(lines[0]);
  const headers         = splitCsvLine(lines[0], separator);
  const dataLines       = lines.slice(1);
  const sampleRows      = dataLines.slice(0, 5).map(l => splitCsvLine(l, separator));
  const detectedBank    = detectBankFromHeaders(headers, sampleRows);
  const suggestedMapping = autoDetectMapping(headers);

  if (!mapping) {
    return { rows: [], headers, detectedBank, suggestedMapping, errors: [], separator };
  }

  const errors: string[] = [];
  const rows: ParsedBankRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const cells = splitCsvLine(dataLines[i], separator);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ""; });

    const dateRaw = row[mapping.colDate] ?? "";
    const date    = parseDate(dateRaw);
    if (!date) { errors.push(`Fila ${i + 2}: fecha inválida "${dateRaw}"`); continue; }

    const desc = (row[mapping.colDesc] ?? "").trim();
    if (!desc) { errors.push(`Fila ${i + 2}: descripción vacía`); continue; }

    const parsed = inferDirection(row, mapping);
    if (!parsed) { errors.push(`Fila ${i + 2}: monto inválido o vacío`); continue; }

    const balanceClp = mapping.colBalance ? parseAmount(row[mapping.colBalance] ?? "") : null;

    rows.push({
      occurredAt:  date,
      description: desc,
      amountClp:   parsed.amount,
      direction:   parsed.direction,
      balanceClp:  balanceClp,
      rawJson:     JSON.stringify(row),
    });
  }

  return { rows, headers, detectedBank, suggestedMapping, errors, separator };
}
