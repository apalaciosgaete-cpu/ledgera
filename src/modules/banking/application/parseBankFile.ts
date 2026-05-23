import type { ParsedBankRow, ColMapping, BankDirection, ParseBankFileResult, BankFileType } from "../domain/bankTypes";

// ── Utilidades compartidas ────────────────────────────────────────────────────

function parseChileanDate(raw: string): Date | null {
  const clean = (raw ?? "").trim();
  const dmy = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}T00:00:00Z`);
  const ymd = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}T00:00:00Z`);
  const attempt = new Date(clean);
  return isNaN(attempt.getTime()) ? null : attempt;
}

function parseChileanAmount(raw: string): number | null {
  if (!raw || raw.trim() === "" || raw.trim() === "-") return null;
  const clean = raw.trim().replace(/\s/g, "").replace(/[$CLP%]/gi, "");
  const num = parseFloat(clean.replace(/\./g, "").replace(",", "."));
  return isNaN(num) ? null : Math.abs(num);
}

export function autoDetectMapping(headers: string[]): Partial<ColMapping> {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const m: Partial<ColMapping> = {};
  for (const h of headers) {
    const n = norm(h);
    if (!m.colDate    && /fecha|date/.test(n))                                    m.colDate    = h;
    if (!m.colDesc    && /desc|glosa|concepto|detail|detalle/.test(n))            m.colDesc    = h;
    if (!m.colBalance && /saldo|balance/.test(n))                                 m.colBalance = h;
    if (!m.colDebit   && /cargo|d[eé]bito|debit|egreso/.test(n))                  m.colDebit   = h;
    if (!m.colCredit  && /abono|cr[eé]dito|credit|ingreso/.test(n))               m.colCredit  = h;
    if (!m.colAmount  && !m.colDebit && !m.colCredit && /monto|amount|valor/.test(n)) m.colAmount = h;
  }
  return m;
}

function inferDirection(
  row: Record<string, string>,
  mapping: ColMapping,
): { amount: number; direction: BankDirection } | null {
  if (mapping.colDebit && mapping.colCredit) {
    const credit = parseChileanAmount(row[mapping.colCredit] ?? "");
    const debit  = parseChileanAmount(row[mapping.colDebit]  ?? "");
    if (credit && credit > 0) return { amount: credit, direction: "INFLOW"  };
    if (debit  && debit  > 0) return { amount: debit,  direction: "OUTFLOW" };
    return null;
  }
  if (mapping.colAmount) {
    const raw    = row[mapping.colAmount] ?? "";
    const amount = parseChileanAmount(raw);
    if (!amount) return null;
    const isNeg = raw.trim().startsWith("-") || raw.trim().startsWith("−");
    return { amount, direction: isNeg ? "OUTFLOW" : "INFLOW" };
  }
  return null;
}

function splitCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === sep && !inQuote) { result.push(current.trim().replace(/^"+|"+$/g, "")); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim().replace(/^"+|"+$/g, ""));
  return result;
}

function detectCsvSeparator(firstLine: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const sep of Object.keys(counts)) {
    counts[sep] = (firstLine.match(new RegExp(`\\${sep}`, "g")) ?? []).length;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function rowsFromMatrix(
  headers: string[],
  dataRows: string[][],
  mapping: ColMapping,
): { rows: ParsedBankRow[]; errors: string[] } {
  const rows: ParsedBankRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const cells = dataRows[i];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = String(cells[idx] ?? "").trim(); });

    const date = parseChileanDate(row[mapping.colDate] ?? "");
    if (!date) { errors.push(`Fila ${i + 2}: fecha inválida "${row[mapping.colDate]}"`); continue; }

    const desc = (row[mapping.colDesc] ?? "").trim();
    if (!desc) { errors.push(`Fila ${i + 2}: descripción vacía`); continue; }

    const parsed = inferDirection(row, mapping);
    if (!parsed) { errors.push(`Fila ${i + 2}: monto inválido o vacío`); continue; }

    const balanceClp = mapping.colBalance ? parseChileanAmount(row[mapping.colBalance] ?? "") : null;

    rows.push({
      occurredAt:  date,
      description: desc,
      amountClp:   parsed.amount,
      direction:   parsed.direction,
      balanceClp:  balanceClp ?? null,
      rawJson:     JSON.stringify(row),
    });
  }

  return { rows, errors };
}

// ── CSV ───────────────────────────────────────────────────────────────────────
export interface CsvDetectResult {
  headers:          string[];
  suggestedMapping: Partial<ColMapping>;
  separator:        string;
  sampleRows:       string[][];
}

export function detectCsv(csvText: string): CsvDetectResult {
  const lines   = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 1) return { headers: [], suggestedMapping: {}, separator: ",", sampleRows: [] };
  const sep     = detectCsvSeparator(lines[0]);
  const headers = splitCsvLine(lines[0], sep);
  const sampleRows = lines.slice(1, 6).map(l => splitCsvLine(l, sep));
  return { headers, suggestedMapping: autoDetectMapping(headers), separator: sep, sampleRows };
}

export function parseCsv(csvText: string, mapping: ColMapping): ParseBankFileResult {
  const lines    = csvText.split(/\r?\n/).filter(l => l.trim());
  const sep      = detectCsvSeparator(lines[0] ?? "");
  const headers  = splitCsvLine(lines[0] ?? "", sep);
  const dataRows = lines.slice(1).map(l => splitCsvLine(l, sep));
  const { rows, errors } = rowsFromMatrix(headers, dataRows, mapping);
  return { rows, errors, fileType: "CSV", needsReview: false };
}

// ── XLSX ──────────────────────────────────────────────────────────────────────
export async function parseXlsx(
  buffer: Buffer,
  mapping?: ColMapping,
): Promise<{ detect: CsvDetectResult; result?: ParseBankFileResult }> {
  const XLSX = await import("xlsx");
  const wb   = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const raw  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];

  if (!raw.length) {
    return { detect: { headers: [], suggestedMapping: {}, separator: "", sampleRows: [] } };
  }

  const headers  = (raw[0] as unknown[]).map(c => String(c ?? "").trim());
  const dataRows = (raw.slice(1) as unknown[][]).map(r => r.map(c => {
    if (c instanceof Date) return c.toISOString().slice(0, 10);
    return String(c ?? "").trim();
  }));

  const sampleRows   = dataRows.slice(0, 5);
  const suggestedMap = autoDetectMapping(headers);
  const detect: CsvDetectResult = { headers, suggestedMapping: suggestedMap, separator: "", sampleRows };

  if (!mapping) return { detect };

  const { rows, errors } = rowsFromMatrix(headers, dataRows, mapping);
  return { detect, result: { rows, errors, fileType: "XLSX", needsReview: false } };
}

// ── PDF ───────────────────────────────────────────────────────────────────────
export async function parsePdf(buffer: Buffer): Promise<ParseBankFileResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const data     = await pdfParse(buffer);
    const text     = data.text;

    // Heurística: detectar filas con fecha al inicio de línea
    const rows: ParsedBankRow[] = [];
    const errors: string[] = [];

    const lines = text.split(/\n/).map((l: string) => l.trim()).filter(Boolean);

    // Patrón chileno: dd/mm/yyyy o dd-mm-yyyy al inicio
    const datePattern = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\s+(.+?)\s+([\d.,]+)\s*$/;

    for (const line of lines) {
      const m = line.match(datePattern);
      if (!m) continue;

      const date = parseChileanDate(m[1]);
      if (!date) continue;

      const desc   = m[2].trim();
      const amount = parseChileanAmount(m[3]);
      if (!amount) continue;

      rows.push({
        occurredAt:  date,
        description: desc,
        amountClp:   amount,
        direction:   "INFLOW",  // PDF sin columnas separadas: requiere revisión manual
        balanceClp:  null,
        rawJson:     JSON.stringify({ raw: line }),
      });
    }

    if (rows.length === 0) {
      errors.push("No se pudieron extraer movimientos del PDF. Usa CSV o XLSX.");
      return { rows: [], errors, fileType: "PDF", needsReview: true };
    }

    // PDF sin columnas de dirección → marcar para revisión
    return { rows, errors, fileType: "PDF", needsReview: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al leer PDF";
    return { rows: [], errors: [msg], fileType: "PDF", needsReview: true };
  }
}

// ── Dispatcher principal ──────────────────────────────────────────────────────
export async function parseBankFile(
  buffer:   Buffer,
  fileName: string,
  mapping?: ColMapping,
): Promise<{ detect: CsvDetectResult | null; result: ParseBankFileResult | null }> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    const result = await parsePdf(buffer);
    return { detect: null, result };
  }

  if (ext === "xlsx" || ext === "xls") {
    const { detect, result } = await parseXlsx(buffer, mapping);
    return { detect, result: result ?? null };
  }

  // CSV / TXT
  const text   = buffer.toString("utf-8");
  const detect = detectCsv(text);
  if (!mapping) return { detect, result: null };
  return { detect, result: parseCsv(text, mapping) };
}
