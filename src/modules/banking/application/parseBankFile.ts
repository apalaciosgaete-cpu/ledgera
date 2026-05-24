import crypto from "crypto";
import Papa from "papaparse";
import * as XLSX from "xlsx";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
import type { ParsedBankMovement } from "../domain/bankTypes";

export type ParsedBankFile = {
  fileHash:  string;
  rows:      ParsedBankMovement[];
  errorRows: number;
  rawPreview: unknown[];
};

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

function parseClp(value: unknown): number | null {
  if (typeof value === "number") return value;

  const raw = String(value ?? "")
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();

  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferYearFromFileName(fileName: string): number | null {
  const match = /20\d{2}/.exec(fileName);
  return match ? Number(match[0]) : null;
}

function parseDate(value: unknown, yearHint?: number | null): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const ddmmyyyy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(raw);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const yearRaw = Number(ddmmyyyy[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // DD/MM without year — use yearHint or current year
  const ddmm = /^(\d{1,2})[/-](\d{1,2})$/.exec(raw);
  if (ddmm) {
    const day = Number(ddmm[1]);
    const month = Number(ddmm[2]);
    const year = yearHint ?? new Date().getFullYear();
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  const normalized = new Map<string, unknown>();

  for (const [key, value] of Object.entries(row)) {
    normalized.set(normalizeHeader(key), value);
  }

  for (const candidate of candidates) {
    const value = normalized.get(normalizeHeader(candidate));
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }

  return null;
}

function normalizeRow(row: Record<string, unknown>, yearHint?: number | null): ParsedBankMovement | null {
  const dateValue = pick(row, ["fecha", "fecha movimiento", "fecha contable", "date"]);
  const descriptionValue = pick(row, ["descripcion", "descripción", "detalle", "glosa", "movimiento", "description"]);

  const charge = parseClp(
    pick(row, [
      "cargo",
      "cargos",
      "debe",
      "retiro",
      "egreso",
      "cheques y otros cargos",
    ]),
  );

  const credit = parseClp(
    pick(row, [
      "abono",
      "abonos",
      "haber",
      "deposito",
      "depositos",
      "ingreso",
      "depositos y otros abonos",
    ]),
  );
  const amount = parseClp(pick(row, ["monto", "importe", "amount"]));
  const balance = parseClp(pick(row, ["saldo", "balance"]));

  const occurredAt = parseDate(dateValue, yearHint);
  const description = String(descriptionValue ?? "").trim();

  if (!occurredAt || !description) return null;

  let amountClp: number | null = null;
  let direction: "INFLOW" | "OUTFLOW" | null = null;

  if (charge && charge > 0) {
    amountClp = charge;
    direction = "OUTFLOW";
  } else if (credit && credit > 0) {
    amountClp = credit;
    direction = "INFLOW";
  } else if (amount !== null) {
    amountClp = Math.abs(amount);
    direction = amount < 0 ? "OUTFLOW" : "INFLOW";
  }

  if (!amountClp || !direction) return null;

  return {
    occurredAt,
    description,
    amountClp,
    direction,
    balanceClp: balance,
    raw: row,
  };
}

function parseCsv(buffer: Buffer): Record<string, unknown>[] {
  const text = buffer.toString("utf8");
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data;
}

function parseXlsx(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) return [];

  const sheet = workbook.Sheets[firstSheet];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  // Find the real header row (Santander has metadata rows before the actual headers)
  const headerIndex = matrix.findIndex(
    (row) =>
      row.some((cell) => String(cell).trim().toUpperCase() === "FECHA") &&
      row.some((cell) =>
        String(cell).trim().toUpperCase().includes("DESCRIPCI"),
      ),
  );

  if (headerIndex === -1) {
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
  }

  const headers = (matrix[headerIndex] as unknown[]).map((cell) =>
    String(cell).trim(),
  );

  return matrix
    .slice(headerIndex + 1)
    .map((row) => {
      const record: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        if (header) record[header] = (row as unknown[])[index] ?? "";
      });

      return record;
    })
    .filter((row) => {
      const fecha = String(row["FECHA"] ?? "").trim();
      const descripcion =
        String(row["DESCRIPCIÓN"] ?? row["DESCRIPCION"] ?? "").trim();

      return Boolean(fecha && descripcion);
    });
}

async function parsePdf(buffer: Buffer): Promise<Record<string, unknown>[]> {
  const parsed = await pdfParse(buffer);
  const lines = parsed.text
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);

  return lines.map((line: string, index: number) => ({
    lineNumber: index + 1,
    rawLine: line,
  }));
}

export async function parseBankFile(fileName: string, buffer: Buffer): Promise<ParsedBankFile> {
  const lower = fileName.toLowerCase();
  const fileHash = hashBuffer(buffer);
  const yearHint = inferYearFromFileName(fileName);

  let rawRows: Record<string, unknown>[] = [];

  if (lower.endsWith(".csv")) {
    rawRows = parseCsv(buffer);
  } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    rawRows = parseXlsx(buffer);
  } else if (lower.endsWith(".pdf")) {
    rawRows = await parsePdf(buffer);
  } else {
    throw new Error("Formato no soportado. Usa PDF, XLSX o CSV.");
  }

  const rows = rawRows
    .map((row) => normalizeRow(row, yearHint))
    .filter((row): row is ParsedBankMovement => row !== null);

  return {
    fileHash,
    rows,
    errorRows:  rawRows.length - rows.length,
    rawPreview: rawRows.slice(0, 20),
  };
}
