import {
  fetchTaxDeposits,
  fetchTaxWithdrawals,
  type BinanceTaxDeposit,
  type BinanceTaxWithdrawal,
} from "../infrastructure/binanceTaxClient";
import type { NormalizedImportRecord } from "../domain/binanceTypes";
import { classifyBinanceEvent } from "../domain/taxNormalization";
import { upsertImportRecord } from "../infrastructure/exchangeImportRepository";
import { fetchHistoricalCryptoPrice } from "./fetchHistoricalCryptoPrice";

const _priceCache = new Map<string, number>();

async function historicalUsd(symbol: string, date: Date): Promise<number> {
  const hourTs = Math.floor(date.getTime() / 3_600_000) * 3_600_000;
  const key    = `${symbol}_${hourTs}`;
  if (_priceCache.has(key)) return _priceCache.get(key)!;
  const price = await fetchHistoricalCryptoPrice(symbol, new Date(hourTs));
  _priceCache.set(key, price);
  return price;
}

async function normalizeDeposit(d: BinanceTaxDeposit): Promise<NormalizedImportRecord> {
  const tax        = classifyBinanceEvent("DEPOSIT", "DEPOSIT");
  const occurredAt = new Date(d.insertTime);
  const priceUsd   = await historicalUsd(d.coin, occurredAt);

  return {
    externalId:          `TAX-DEPOSIT-${d.id}`,
    externalType:        "TAX_DEPOSIT",
    movementType:        "DEPOSIT",
    symbol:              d.coin,
    quantity:            Number(d.amount),
    priceUsd,
    feeUsd:              0,
    occurredAt,
    normalizedEventType: tax.normalizedEventType,
    taxTreatment:        tax.taxTreatment,
    inventoryEffect:     tax.inventoryEffect,
    economicEffect:      tax.economicEffect,
  };
}

async function normalizeWithdrawal(w: BinanceTaxWithdrawal): Promise<NormalizedImportRecord> {
  const tax        = classifyBinanceEvent("WITHDRAW", "WITHDRAW");
  const occurredAt = new Date(w.applyTime.replace(" ", "T") + "Z");
  const priceUsd   = await historicalUsd(w.coin, occurredAt);
  const feeUsd     = Number(w.transactionFee) * priceUsd;

  return {
    externalId:          `TAX-WITHDRAW-${w.id}`,
    externalType:        "TAX_WITHDRAW",
    movementType:        "WITHDRAW",
    symbol:              w.coin,
    quantity:            Number(w.amount),
    priceUsd,
    feeUsd,
    occurredAt,
    normalizedEventType: tax.normalizedEventType,
    taxTreatment:        tax.taxTreatment,
    inventoryEffect:     tax.inventoryEffect,
    economicEffect:      tax.economicEffect,
  };
}

export type ImportTaxTransfersResult = {
  imported:    number;
  skipped:     number;
  deposits:    number;
  withdrawals: number;
};

export async function importBinanceTaxTransfers(
  userId:       string,
  connectionId: string,
  provider:     string,
  apiKey:       string,
  apiSecret:    string,
  year:         number,
  month:        number,
): Promise<ImportTaxTransfersResult> {
  const startTime = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const endTime   = Date.UTC(year, month,     1, 0, 0, 0, 0) - 1;

  const [rawDeposits, rawWithdrawals] = await Promise.all([
    fetchTaxDeposits(apiKey, apiSecret, startTime, endTime),
    fetchTaxWithdrawals(apiKey, apiSecret, startTime, endTime),
  ]);

  let imported    = 0;
  let skipped     = 0;
  let deposits    = 0;
  let withdrawals = 0;

  for (const d of rawDeposits) {
    const rec = await normalizeDeposit(d);
    const { isNew } = await upsertImportRecord(userId, connectionId, provider, rec, JSON.stringify(d));
    if (isNew) { imported++; deposits++;    }
    else       { skipped++;                 }
  }

  for (const w of rawWithdrawals) {
    const rec = await normalizeWithdrawal(w);
    const { isNew } = await upsertImportRecord(userId, connectionId, provider, rec, JSON.stringify(w));
    if (isNew) { imported++; withdrawals++; }
    else       { skipped++;                 }
  }

  return { imported, skipped, deposits, withdrawals };
}
