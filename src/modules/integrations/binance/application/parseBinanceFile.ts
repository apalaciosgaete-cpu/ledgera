/**
 * Binance CSV file parser.
 *
 * Supported formats:
 *   A) Trade History — Date(UTC), Pair, Side, Price, Executed, Amount, Fee
 *   B) Trade History alt — Date(UTC), Pair, Type, Price, Amount, Total, Fee, Fee Coin
 *   C) Deposit History — Date(UTC), Coin, Amount, TransactionFee, Address, TXID, Status
 *   D) Withdrawal History — Date(UTC), Coin, Amount, TransactionFee, Address, TXID, Status
 */

export type ParsedBinanceTrade = {
  kind:       "TRADE";
  date:       string;   // ISO string
  pair:       string;   // e.g. "BTCUSDT"
  side:       "BUY" | "SELL";
  price:      number;   // price in quote asset
  quantity:   number;   // base asset quantity
  total:      number;   // quote asset total
  fee:        number;
  feeAsset:   string;
};

export type ParsedBinanceTransfer = {
  kind:    "DEPOSIT" | "WITHDRAWAL";
  date:    string;
  coin:    string;
  amount:  number;
  fee:     number;
};

export type ParsedBinanceRow = ParsedBinanceTrade | ParsedBinanceTransfer;

type DetectedFormat = "TRADE_A" | "TRADE_B" | "DEPOSIT" | "WITHDRAWAL" | "UNKNOWN";

function detectFormat(header: string, kindHint?: "DEPOSIT" | "WITHDRAWAL"): DetectedFormat {
  const h = header.toLowerCase();
  if (h.includes("txid") || h.includes("address")) {
    if (!h.includes("transactionfee")) return "UNKNOWN";
    return kindHint === "WITHDRAWAL" ? "WITHDRAWAL" : "DEPOSIT";
  }
  if (h.includes("fee coin") || (h.includes("total") && !h.includes("executed"))) return "TRADE_B";
  if (h.includes("executed")) return "TRADE_A";
  return "UNKNOWN";
}

// Strips asset suffix from values like "0.001 BTC" → { value: 0.001, asset: "BTC" }
function parseValueWithAsset(s: string): { value: number; asset: string } {
  const clean = s.trim().replace(/,/g, "");
  const match = clean.match(/^([0-9.]+)\s*([A-Z]+)?$/i);
  if (!match) return { value: 0, asset: "" };
  return { value: parseFloat(match[1] ?? "0") || 0, asset: (match[2] ?? "").toUpperCase() };
}

function parseNum(s: string): number {
  return parseFloat(s.replace(/,/g, "").trim()) || 0;
}

function parseDateIso(s: string): string {
  const d = new Date(s.trim().replace(" ", "T") + (s.includes("T") || s.includes(":") ? "Z" : ""));
  return isNaN(d.getTime()) ? new Date(s.trim()).toISOString() : d.toISOString();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.trim().split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function parseTradeA(headers: string[], rows: string[][]): ParsedBinanceTrade[] {
  const idx = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  const iDate = idx("Date"); const iPair = idx("Pair"); const iSide = idx("Side");
  const iPrice = idx("Price"); const iExec = idx("Executed"); const iAmt = idx("Amount"); const iFee = idx("Fee");
  if (iDate < 0 || iPair < 0) return [];

  const result: ParsedBinanceTrade[] = [];
  for (const row of rows) {
    const side = (row[iSide] ?? "").toUpperCase();
    if (side !== "BUY" && side !== "SELL") continue;
    const exec = parseValueWithAsset(row[iExec] ?? "");
    const amt  = parseValueWithAsset(row[iAmt]  ?? "");
    const fee  = parseValueWithAsset(row[iFee]  ?? "");
    result.push({
      kind:      "TRADE",
      date:      parseDateIso(row[iDate] ?? ""),
      pair:      (row[iPair] ?? "").trim().toUpperCase(),
      side:      side as "BUY" | "SELL",
      price:     parseNum(row[iPrice] ?? ""),
      quantity:  exec.value,
      total:     amt.value,
      fee:       fee.value,
      feeAsset:  fee.asset || amt.asset || "USDT",
    });
  }
  return result;
}

function parseTradeB(headers: string[], rows: string[][]): ParsedBinanceTrade[] {
  const idx = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  const iDate = idx("Date"); const iPair = idx("Pair");
  const iType = idx("Type") >= 0 ? idx("Type") : idx("Side");
  const iPrice = idx("Price"); const iAmt = idx("Amount"); const iTotal = idx("Total");
  const iFee = idx("Fee"); const iFeeCoin = idx("Fee Coin");
  if (iDate < 0 || iPair < 0) return [];

  const result: ParsedBinanceTrade[] = [];
  for (const row of rows) {
    const side = (row[iType] ?? "").toUpperCase();
    if (side !== "BUY" && side !== "SELL") continue;
    result.push({
      kind:      "TRADE",
      date:      parseDateIso(row[iDate] ?? ""),
      pair:      (row[iPair] ?? "").trim().toUpperCase(),
      side:      side as "BUY" | "SELL",
      price:     parseNum(row[iPrice] ?? ""),
      quantity:  parseNum(row[iAmt] ?? ""),
      total:     parseNum(row[iTotal] ?? ""),
      fee:       parseNum(row[iFee] ?? ""),
      feeAsset:  (row[iFeeCoin] ?? "").trim().toUpperCase() || "USDT",
    });
  }
  return result;
}

function parseTransfer(
  kind: "DEPOSIT" | "WITHDRAWAL",
  headers: string[],
  rows: string[][],
): ParsedBinanceTransfer[] {
  const idx = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  const iDate = idx("Date"); const iCoin = idx("Coin");
  const iAmt = idx("Amount"); const iFee = idx("TransactionFee");
  if (iDate < 0 || iCoin < 0) return [];

  return rows.map(row => ({
    kind,
    date:   parseDateIso(row[iDate] ?? ""),
    coin:   (row[iCoin] ?? "").trim().toUpperCase(),
    amount: parseNum(row[iAmt] ?? ""),
    fee:    parseNum(row[iFee] ?? ""),
  })).filter(r => r.coin && r.amount > 0);
}

function parseDeposit(headers: string[], rows: string[][]): ParsedBinanceTransfer[] {
  return parseTransfer("DEPOSIT", headers, rows);
}

function parseWithdrawal(headers: string[], rows: string[][]): ParsedBinanceTransfer[] {
  return parseTransfer("WITHDRAWAL", headers, rows);
}

export function parseBinanceFile(
  csvText: string,
  opts?: { kindHint?: "DEPOSIT" | "WITHDRAWAL" },
): { rows: ParsedBinanceRow[]; format: string; errors: string[] } {
  const errors: string[] = [];
  const raw   = parseCsv(csvText);
  if (raw.length < 2) return { rows: [], format: "UNKNOWN", errors: ["El archivo no contiene datos."] };

  const headers = (raw[0] ?? []).map(h => h.replace(/[﻿\r]/g, "").trim());
  const data    = raw.slice(1).filter(r => r.some(c => c.trim()));
  const format  = detectFormat(headers.join(","), opts?.kindHint);

  let rows: ParsedBinanceRow[] = [];
  if (format === "TRADE_A")    rows = parseTradeA(headers, data);
  else if (format === "TRADE_B")    rows = parseTradeB(headers, data);
  else if (format === "DEPOSIT")    rows = parseDeposit(headers, data);
  else if (format === "WITHDRAWAL") rows = parseWithdrawal(headers, data);
  else errors.push(`Formato no reconocido. Cabeceras detectadas: ${headers.slice(0, 6).join(", ")}`);

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No se encontraron operaciones válidas en el archivo.");
  }

  return { rows, format, errors };
}
