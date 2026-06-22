import type { ParsedBinanceRow, ParsedBinanceTrade, ParsedBinanceTransfer } from "./parseBinanceFile";
import type { NormalizedImportRecord } from "../domain/binanceTypes";
import { classifyBinanceEvent } from "../domain/taxNormalization";
import { fetchHistoricalCryptoPrice } from "./fetchHistoricalCryptoPrice";

const STABLECOIN_QUOTES = ["USDT", "USDC", "BUSD", "TUSD", "DAI", "FDUSD", "USDP"];

const _priceCache = new Map<string, number>();

async function historicalUsd(asset: string, date: Date): Promise<number> {
  const hourTs = Math.floor(date.getTime() / 3_600_000) * 3_600_000;
  const key    = `${asset}_${hourTs}`;
  if (_priceCache.has(key)) return _priceCache.get(key)!;
  const price = await fetchHistoricalCryptoPrice(asset, new Date(hourTs));
  _priceCache.set(key, price);
  return price;
}

function detectQuote(pair: string): string {
  for (const stable of STABLECOIN_QUOTES) {
    if (pair.endsWith(stable)) return stable;
  }
  return "BTC";
}

function detectBase(pair: string, quote: string): string {
  return pair.slice(0, pair.length - quote.length);
}

async function normalizeTrade(row: ParsedBinanceTrade): Promise<NormalizedImportRecord> {
  const tradeDate    = new Date(row.date);
  const quote        = detectQuote(row.pair);
  const base         = detectBase(row.pair, quote);
  const movementType = row.side;

  let priceUsd = row.price;
  if (quote === "BTC") {
    const btcUsd = await historicalUsd("BTC", tradeDate);
    priceUsd = row.price * btcUsd;
  }

  let feeUsd = 0;
  if (row.fee > 0) {
    const fa = row.feeAsset.toUpperCase();
    if (STABLECOIN_QUOTES.includes(fa)) {
      feeUsd = row.fee;
    } else {
      const assetUsd = await historicalUsd(fa, tradeDate);
      feeUsd = row.fee * assetUsd;
    }
  }

  const tax     = classifyBinanceEvent("TRADE", movementType);
  const dateKey = tradeDate.getTime().toString();

  return {
    externalId:          `FILE-TRADE-${row.pair}-${dateKey}-${row.side}-${row.quantity}`,
    externalType:        "TRADE",
    movementType,
    symbol:              base,
    quantity:            row.quantity,
    priceUsd,
    feeUsd,
    occurredAt:          tradeDate,
    quoteAsset:          quote,
    normalizedEventType: tax.normalizedEventType,
    taxTreatment:        tax.taxTreatment,
    inventoryEffect:     tax.inventoryEffect,
    economicEffect:      tax.economicEffect,
  };
}

function normalizeTransfer(row: ParsedBinanceTransfer): NormalizedImportRecord {
  const isDeposit    = row.kind === "DEPOSIT";
  const movementType = isDeposit ? "DEPOSIT" : "WITHDRAW";
  const externalType = isDeposit ? "DEPOSIT" : "WITHDRAW";
  const tax          = classifyBinanceEvent(externalType, movementType);
  const dateKey      = new Date(row.date).getTime().toString();

  return {
    externalId:          `FILE-${externalType}-${row.coin}-${dateKey}-${row.amount}`,
    externalType,
    movementType,
    symbol:              row.coin,
    quantity:            row.amount,
    priceUsd:            0,
    feeUsd:              row.fee,
    occurredAt:          new Date(row.date),
    normalizedEventType: tax.normalizedEventType,
    taxTreatment:        tax.taxTreatment,
    inventoryEffect:     tax.inventoryEffect,
    economicEffect:      tax.economicEffect,
  };
}

export async function normalizeBinanceFileRow(row: ParsedBinanceRow): Promise<NormalizedImportRecord> {
  if (row.kind === "TRADE") return normalizeTrade(row);
  return normalizeTransfer(row);
}
