import { prisma } from "@/lib/prisma";
import { confirmImport } from "../infrastructure/exchangeImportRepository";
import { fetchHistoricalCryptoPrice } from "./fetchHistoricalCryptoPrice";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { enforceMovementLimit } from "@/modules/subscription/application/enforceMovementLimit";
import type { NormalizedImportRecord } from "../domain/binanceTypes";

export type ConfirmOverride = {
  movementType?: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";
  priceUsd?:     number;
  feeUsd?:       number;
};

export type ConfirmRecordResult = {
  movementId: string;
};

type MinimalRecord = {
  id:             string;
  userId:         string;
  provider:       string;
  normalizedJson: string | null;
  occurredAt:     Date;
};

/**
 * Creates a single PortfolioMovement from an ExchangeImportRecord and marks it CONFIRMED.
 * Does NOT call rebuildTaxEvents — the caller is responsible for that.
 *
 * For DEPOSIT/WITHDRAW: fetches historical price (no market tx price available).
 * For BUY/SELL:         asserts the tax period is open before writing.
 */
export async function confirmExchangeRecord(
  record:   MinimalRecord,
  override?: ConfirmOverride,
): Promise<ConfirmRecordResult> {
  const normalized = JSON.parse(record.normalizedJson ?? "{}") as NormalizedImportRecord;

  if (override?.movementType) normalized.movementType = override.movementType;
  if (override?.priceUsd !== undefined && override.priceUsd >= 0) normalized.priceUsd = override.priceUsd;
  if (override?.feeUsd   !== undefined && override.feeUsd   >= 0) normalized.feeUsd   = override.feeUsd;

  const occurredAt  = normalized.occurredAt instanceof Date
    ? normalized.occurredAt
    : new Date(normalized.occurredAt as unknown as string ?? record.occurredAt);

  const isTransfer  = normalized.movementType === "DEPOSIT" || normalized.movementType === "WITHDRAW";
  const isBtcQuoted = !isTransfer && normalized.quoteAsset === "BTC";

  // Price source:
  //   Transfers → historical klines (no trade price)
  //   BTC-quoted pairs → convert via historical price
  //   Everything else  → use normalized.priceUsd from the trade
  const priceUsd = (isTransfer || isBtcQuoted)
    ? await fetchHistoricalCryptoPrice(normalized.symbol, occurredAt)
    : normalized.priceUsd;

  if (!isTransfer) {
    await assertPeriodOpen(occurredAt, record.userId);
  }

  await enforceMovementLimit({ userId: record.userId });

  const movement = await prisma.portfolioMovement.create({
    data: {
      userId:     record.userId,
      type:       normalized.movementType,
      symbol:     normalized.symbol,
      quantity:   normalized.quantity,
      priceUsd,
      feeUsd:     normalized.feeUsd,
      executedAt: occurredAt,
      source:     record.provider,
      externalId: normalized.externalId,
    },
  });

  await confirmImport(record.id, record.userId, movement.id);

  return { movementId: movement.id };
}
