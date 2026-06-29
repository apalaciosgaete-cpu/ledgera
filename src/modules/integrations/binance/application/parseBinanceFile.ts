/**
 * Binance CSV / spreadsheet-normalized parser.
 *
 * Supported tabular formats:
 *   A) Trade History — Date(UTC), Pair, Side, Price, Executed, Amount, Fee
 *   B) Trade History alt — Date(UTC), Pair, Type, Price, Amount, Total, Fee, Fee Coin
 *   C) Deposit History — Date(UTC), Coin, Amount, TransactionFee, Address, TXID, Status
 *   D) Withdrawal History — Date(UTC), Coin, Amount, TransactionFee, Address, TXID, Status
 *   E) Fiat purchase history — Hora, Método, Monto a gastar, Monto a recibir, Tarifa, Precio, Estado, TXID
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

export type ParsedBinanceFiatPurchase = {
  kind:       "FIAT_PURCHASE";
  date:       string;
  method:     string;
  asset:      string;
  quantity:   number;
  fiatAmount: number;
  fiatAsset:  string;
  fee:        number;
  feeAsset:   string;
  price:      number;
  pricePair:  string;
  txId:       string;
};

export type ParsedBinanceRow = ParsedBinanceTrade | ParsedBinanceTransfer | ParsedBinanceFiatPurchase;

type DetectedFormat = "TRADE_A" | "TRADE_B" | "DEPOSIT" | "WITHDRAWAL" | "FIAT_PURCHASE" | "UNKNOWN";

function normalizeHeader(value: string): string {
  return value.replace(/[﻿\r]/g, "").trim();
}

function detectFormat(header: string, kindHint?: "DEPOSIT" | "WITHDRAWAL"): DetectedFormat {
  const h = header.toLowerCase();
  if (
    h.includes("monto a gastar") &&
    h.includes("monto a recibir") &&
    (h.includes("id de transacción") || h.includes("txid"))
  ) {
    return "FIAT_PURCHASE";
  }
  if (h.includes("txid") || h.includes("address")) {
    if (!h.includes("transactionfee")) return "UNKNOWN";
    return kindHint === "WITHDRAWAL" ? "WITHDRAWAL" : "DEPOSIT";
  }
  if (h.includes("fee coin") || (h.includes("total") && !h.includes("executed"))) return "TRADE_B";
  if (h.includes("executed")) return "TRADE_A";
  return "UNKNOWN";
}

function findHeaderRow(
  raw: string[][],
  kindHint?: "DEPOSIT" | "WITHDRAWAL",
): { index: number; format: DetectedFormat } {
  const scanLimit = Math.min(raw.length, 40);

  for (let i = 0; i < scanLimit; i++) {
    const row = raw[i] ?? [];
    const format = detectFormat(row.map(normalizeHeader).join(","), kindHint);
    if (format !== "UNKNOWN") return { index: i, format };
  }

  const firstRow = raw[0] ?? [];
  return {
    index: 0,
    format: detectFormat(firstRow.map(normalizeHeader).join(","), kindHint),
  };
}

// Strips asset suffix from values like "0.001 BTC" → { value: 0.001, asset: "BTC" }
function parseValueWithAsset(s: string): { value: number; asset: string } {
  const clean = s.trim().replace(/,/g, "");
  const match = clean.match(/^(-?[0-9.]+)\s*([A-Z]+)?$/i);
  if (!match) return { value: 0, asset: "" };
  return { value: parseFloat(match[1] ?? "0") || 0, asset: (match[2] ?? "").toUpperCase() };
}

function parsePriceWithPair(s: string): { value: number; pair: string } {
  const clean = s.trim().replace(/,/g, "");
  const match = clean.match(/^(-?[0-9.]+)\s*([A-Z]+\/[A-Z]+)?$/i);
  if (!match) return { value: parseNum(s), pair: "" };
  return { value: parseFloat(match[1] ?? "0") || 0, pair: (match[2] ?? "").toUpperCase() };
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

function parseFiatPurchase(headers: string[], rows: string[][]): ParsedBinanceFiatPurchase[] {
  const idx = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  const iDate = idx("Hora");
  const iMethod = idx("Método");
  const iSpend = idx("Monto a gastar");
  const iReceive = idx("Monto a recibir");
  const iFee = idx("Tarifa");
  const iPrice = idx("Precio");
  const iStatus = idx("Estado");
  const iTx = idx("ID de transacción") >= 0 ? idx("ID de transacción") : idx("TXID");

  if (iDate < 0 || iSpend < 0 || iReceive < 0) return [];

  const result: ParsedBinanceFiatPurchase[] = [];

  for (const row of rows) {
    const status = (row[iStatus] ?? "").trim().toLowerCase();
    if (status && !status.includes("successful") && !status.includes("complet")) continue;

    const spend = parseValueWithAsset(row[iSpend] ?? "");
    const receive = parseValueWithAsset(row[iReceive] ?? "");
    const fee = parseValueWithAsset(row[iFee] ?? "");
    const price = parsePriceWithPair(row[iPrice] ?? "");
    const txId = (row[iTx] ?? "").trim();

    if (!receive.asset || receive.value <= 0) continue;

    result.push({
      kind:       "FIAT_PURCHASE",
      date:       parseDateIso(row[iDate] ?? ""),
      method:     (row[iMethod] ?? "").trim(),
      asset:      receive.asset,
      quantity:   receive.value,
      fiatAmount: spend.value,
      fiatAsset:  spend.asset || "CLP",
      fee:        fee.value,
      feeAsset:   fee.asset || spend.asset || "CLP",
      price:      price.value,
      pricePair:  price.pair,
      txId,
    });
  }

  return result;
}

export function parseBinanceFile(
  csvText: string,
  opts?: { kindHint?: "DEPOSIT" | "WITHDRAWAL" },
): { rows: ParsedBinanceRow[]; format: string; errors: string[] } {
  const errors: string[] = [];
  const raw   = parseCsv(csvText);
  if (raw.length < 2) return { rows: [], format: "UNKNOWN", errors: ["El archivo no contiene datos."] };

  const detected = findHeaderRow(raw, opts?.kindHint);
  const headers = (raw[detected.index] ?? []).map(normalizeHeader);
  const data    = raw.slice(detected.index + 1).filter(r => r.some(c => c.trim()));
  const format  = detected.format;

  let rows: ParsedBinanceRow[] = [];
  if (format === "TRADE_A")              rows = parseTradeA(headers, data);
  else if (format === "TRADE_B")         rows = parseTradeB(headers, data);
  else if (format === "DEPOSIT")         rows = parseDeposit(headers, data);
  else if (format === "WITHDRAWAL")      rows = parseWithdrawal(headers, data);
  else if (format === "FIAT_PURCHASE")   rows = parseFiatPurchase(headers, data);
  else errors.push(`Formato no reconocido. Cabeceras detectadas: ${headers.slice(0, 8).join(", ")}`);

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No se encontraron operaciones válidas en el archivo.");
  }

  return { rows, format, errors };
}
