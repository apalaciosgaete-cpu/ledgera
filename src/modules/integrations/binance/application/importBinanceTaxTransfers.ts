import {
  fetchTaxDeposits,
  fetchTaxWithdrawals,
  type BinanceTaxDeposit,
  type BinanceTaxWithdrawal,
} from "../infrastructure/binanceTaxClient";
import type { NormalizedImportRecord } from "../domain/binanceTypes";
import { classifyBinanceEvent } from "../domain/taxNormalization";
import { upsertImportRecord } from "../infrastructure/exchangeImportRepository";

function normalizeDeposit(d: BinanceTaxDeposit): NormalizedImportRecord {
  const tax = classifyBinanceEvent("DEPOSIT", "DEPOSIT");
  return {
    externalId:          `TAX-DEPOSIT-${d.id}`,
    externalType:        "DEPOSIT",
    movementType:        "DEPOSIT",
    symbol:              d.coin,
    quantity:            Number(d.amount),
    priceUsd:            0,
    feeUsd:              0,
    occurredAt:          new Date(d.insertTime),
    normalizedEventType: tax.normalizedEventType,
    taxTreatment:        tax.taxTreatment,
    inventoryEffect:     tax.inventoryEffect,
    economicEffect:      tax.economicEffect,
  };
}

function normalizeWithdrawal(w: BinanceTaxWithdrawal): NormalizedImportRecord {
  const tax = classifyBinanceEvent("WITHDRAW", "WITHDRAW");
  return {
    externalId:          `TAX-WITHDRAW-${w.id}`,
    externalType:        "WITHDRAW",
    movementType:        "WITHDRAW",
    symbol:              w.coin,
    quantity:            Number(w.amount),
    priceUsd:            0,
    feeUsd:              Number(w.transactionFee),
    occurredAt:          new Date(w.applyTime.replace(" ", "T") + "Z"),
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
    const rec = normalizeDeposit(d);
    const { isNew } = await upsertImportRecord(userId, connectionId, provider, rec, JSON.stringify(d));
    if (isNew) { imported++; deposits++;    }
    else       { skipped++;                 }
  }

  for (const w of rawWithdrawals) {
    const rec = normalizeWithdrawal(w);
    const { isNew } = await upsertImportRecord(userId, connectionId, provider, rec, JSON.stringify(w));
    if (isNew) { imported++; withdrawals++; }
    else       { skipped++;                 }
  }

  return { imported, skipped, deposits, withdrawals };
}
