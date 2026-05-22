import type {
  BinanceDepositRaw,
  BinanceTradeRaw,
  BinanceWithdrawRaw,
  NormalizedImportRecord,
} from "../domain/binanceTypes";
import { classifyBinanceEvent } from "../domain/taxNormalization";

const STABLECOIN_QUOTES = ["USDT", "USDC", "BUSD", "TUSD", "DAI", "FDUSD"];

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

export function normalizeTrade(raw: BinanceTradeRaw): NormalizedImportRecord {
  const movementType = raw.isBuyer ? "BUY" : "SELL";
  const priceUsd     = parseFloat(raw.price);
  const qty          = parseFloat(raw.qty);
  const feeUsd       = raw.commissionAsset === "USDT"
    ? parseFloat(raw.commission)
    : 0;

  const tax = classifyBinanceEvent("TRADE", movementType);

  return {
    externalId:          `TRADE-${raw.symbol}-${raw.id}`,
    externalType:        "TRADE",
    movementType,
    symbol:              baseAsset(raw.symbol),
    quantity:            qty,
    priceUsd,
    feeUsd,
    occurredAt:          new Date(raw.time),
    quoteAsset:          quoteAsset(raw.symbol),
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
