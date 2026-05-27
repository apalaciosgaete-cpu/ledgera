// src/modules/integrations/binance/application/getExchangeFinancialEvents.ts
import { prisma } from "@/lib/prisma";

export type ExchangeFinancialEvent = {
  occurredAt: Date;
  provider: string;
  externalId: string;
  eventType: string;
  asset: string;
  quantity: number;
  priceUsd: number;
  estimatedUsd: number;
  portfolioMovementId: string | null;
  taxTreatment: string | null;
  inventoryEffect: string | null;
  economicEffect: string | null;
};

export type GetExchangeFinancialEventsInput = {
  userId: string;
  from?: Date;
  to?: Date;
  providers?: string[];
};

type JsonRecord = Record<string, unknown>;

function parseJsonObject(value: string | null | undefined): JsonRecord {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {};
  } catch {
    return {};
  }
}

function readString(source: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return null;
}

function readNumber(source: JsonRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
      const normalized = value.replace(/,/g, "").trim();
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function normalizeProvider(provider: string): string {
  const upper = provider.trim().toUpperCase();
  if (upper === "BINANCE_TAX") return "BINANCE_TAX";
  if (upper === "BINANCE") return "BINANCE";
  return upper || "UNKNOWN";
}

function normalizeEventType(externalType: string | null, movementType?: string | null): string {
  const normalized = externalType?.trim().toUpperCase();

  if (normalized) {
    if (["SPOT_BUY", "BUY", "TRADE_BUY"].includes(normalized)) return "SPOT_BUY";
    if (["SPOT_SELL", "SELL", "TRADE_SELL"].includes(normalized)) return "SPOT_SELL";
    if (["DEPOSIT", "EXTERNAL_DEPOSIT", "CRYPTO_DEPOSIT"].includes(normalized)) return "EXTERNAL_DEPOSIT";
    if (["WITHDRAW", "WITHDRAWAL", "EXTERNAL_WITHDRAW", "EXTERNAL_WITHDRAWAL", "CRYPTO_WITHDRAWAL"].includes(normalized)) {
      return "EXTERNAL_WITHDRAW";
    }
    if (["P2P", "P2P_BUY", "P2P_SELL"].includes(normalized)) return "P2P";
    if (["TRANSFER", "INTERNAL_TRANSFER"].includes(normalized)) return "INTERNAL_TRANSFER";
  }

  const movement = movementType?.trim().toUpperCase();
  if (movement === "BUY") return "SPOT_BUY";
  if (movement === "SELL") return "SPOT_SELL";

  return normalized || "UNKNOWN";
}

function firstPayloadValue(normalizedJson: string | null, rawPayload: string): JsonRecord {
  const normalized = parseJsonObject(normalizedJson);
  const raw = parseJsonObject(rawPayload);

  return {
    ...raw,
    ...normalized,
  };
}

export async function getExchangeFinancialEvents({
  userId,
  from,
  to,
  providers,
}: GetExchangeFinancialEventsInput): Promise<ExchangeFinancialEvent[]> {
  const providerFilter = providers
    ?.map(normalizeProvider)
    .filter((provider) => provider.length > 0);

  const records = await prisma.exchangeImportRecord.findMany({
    where: {
      userId,
      provider: providerFilter && providerFilter.length > 0
        ? { in: providerFilter }
        : undefined,
      occurredAt: from && to
        ? { gte: from, lte: to }
        : from
          ? { gte: from }
          : to
            ? { lte: to }
            : undefined,
    },
    include: {
      movement: true,
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: 500,
  });

  return records.map((record) => {
    const payload = firstPayloadValue(record.normalizedJson, record.rawPayload);
    const movement = record.movement;

    const asset = movement?.symbol
      ?? readString(payload, ["asset", "symbol", "coin", "baseAsset", "currency"])
      ?? "UNKNOWN";

    const quantity = movement?.quantity
      ?? readNumber(payload, ["quantity", "qty", "amount", "baseQuantity", "executedQty"])
      ?? 0;

    const priceUsd = movement?.priceUsd
      ?? readNumber(payload, ["priceUsd", "price_usd", "price", "unitPrice", "averagePrice"])
      ?? 0;

    const estimatedUsd = readNumber(payload, ["estimatedUsd", "estimated_usd", "totalUsd", "quoteQuantity", "quoteQty"])
      ?? (quantity > 0 && priceUsd > 0 ? quantity * priceUsd : 0);

    return {
      occurredAt: record.occurredAt,
      provider: normalizeProvider(record.provider),
      externalId: record.externalId,
      eventType: normalizeEventType(record.normalizedEventType ?? record.externalType, movement?.type),
      asset,
      quantity,
      priceUsd,
      estimatedUsd,
      portfolioMovementId: record.movementId,
      taxTreatment: record.taxTreatment,
      inventoryEffect: record.inventoryEffect,
      economicEffect: record.economicEffect,
    };
  });
}
