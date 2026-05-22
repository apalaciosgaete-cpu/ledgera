import type {
  BinanceDepositRaw,
  BinanceTradeRaw,
  BinanceWithdrawRaw,
  NormalizedImportRecord,
} from "../domain/binanceTypes";
import { classifyBinanceEvent } from "../domain/taxNormalization";
import { fetchHistoricalCryptoPrice } from "./fetchHistoricalCryptoPrice";

const STABLECOIN_QUOTES = ["USDT", "USDC", "BUSD", "TUSD", "DAI", "FDUSD"];

// Keyed by `${asset}_${hourTimestamp}` — historical prices never change.
const _priceCache = new Map<string, number>();

async function historicalUsd(asset: string, date: Date): Promise<number> {
  const hourTs = Math.floor(date.getTime() / 3_600_000) * 3_600_000;
  const key    = `${asset}_${hourTs}`;
  if (_priceCache.has(key)) return _priceCache.get(key)!;
  const price = await fetchHistoricalCryptoPrice(asset, new Date(hourTs));
  _priceCache.set(key, price);
  return price;
}

function baseAsset(symbol: string): string {
  for (const stable of STABLECOIN_QUOTES) {
    if (symbol.endsWith(stable)) return symbol.slice(0, -stable.length);
  }
  return symbol.slice(0, -3);
}

function quoteAsset(symbol: string): string {
  for (const stable of STABLECOIN_QUOTES) {
    if (symbol.endsWith(stable)) return stable;
  }
  return "BTC";
}

export async function normalizeTrade(raw: BinanceTradeRaw): Promise<NormalizedImportRecord> {
  const movementType = raw.isBuyer ? "BUY" : "SELL";
  const qty          = parseFloat(raw.qty);
  const commission   = parseFloat(raw.commission);
  const tradeDate    = new Date(raw.time);
  const quote        = quoteAsset(raw.symbol);

  // For BTC-quoted pairs (e.g. ETHBTC) the raw price is in BTC, not USD.
  let priceUsd = parseFloat(raw.price);
  if (quote === "BTC") {
    const btcUsd = await historicalUsd("BTC", tradeDate);
    priceUsd = priceUsd * btcUsd;
  }

  // Convert commission to USD regardless of which asset Binance charged.
  let feeUsd = 0;
  if (commission > 0) {
    const commAsset = raw.commissionAsset.toUpperCase();
    if (STABLECOIN_QUOTES.includes(commAsset)) {
      feeUsd = commission;
    } else {
      const assetUsd = await historicalUsd(commAsset, tradeDate);
      feeUsd = commission * assetUsd;
    }
  }

  const tax = classifyBinanceEvent("TRADE", movementType);

  return {
    externalId:          `TRADE-${raw.symbol}-${raw.id}`,
    externalType:        "TRADE",
    movementType,
    symbol:              baseAsset(raw.symbol),
    quantity:            qty,
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

export function normalizeDeposit(raw: BinanceDepositRaw): NormalizedImportRecord {
  const tax = classifyBinanceEvent("DEPOSIT", "DEPOSIT");

  return {
    externalId:          `DEPOSIT-${raw.id}`,
    externalType:        "DEPOSIT",
    movementType:        "DEPOSIT",
    symbol:              raw.coin,
    quantity:            parseFloat(raw.amount),
    priceUsd:            0,
    feeUsd:              0,
    occurredAt:          new Date(raw.insertTime),
    normalizedEventType: tax.normalizedEventType,
    taxTreatment:        tax.taxTreatment,
    inventoryEffect:     tax.inventoryEffect,
    economicEffect:      tax.economicEffect,
  };
}

export function normalizeWithdraw(raw: BinanceWithdrawRaw): NormalizedImportRecord {
  const tax = classifyBinanceEvent("WITHDRAW", "WITHDRAW");

  return {
    externalId:          `WITHDRAW-${raw.id}`,
    externalType:        "WITHDRAW",
    movementType:        "WITHDRAW",
    symbol:              raw.coin,
    quantity:            parseFloat(raw.amount),
    priceUsd:            0,
    feeUsd:              parseFloat(raw.transactionFee),
    occurredAt:          new Date(raw.applyTime),
    normalizedEventType: tax.normalizedEventType,
    taxTreatment:        tax.taxTreatment,
    inventoryEffect:     tax.inventoryEffect,
    economicEffect:      tax.economicEffect,
  };
}
