import { prisma } from "@/lib/prisma";

export type ExchangeFinancialEvent = {
  provider: string;
  externalId: string;
  eventType: string;
  portfolioMovementId: string | null;
  occurredAt: Date;
  asset: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  estimatedUsd: number;
  taxTreatment: string | null;
  inventoryEffect: string | null;
  economicEffect: string | null;
};

type NormalizedPayload = {
  symbol?: string;
  quantity?: number;
  priceUsd?: number;
  feeUsd?: number;
};

export async function getExchangeFinancialEvents(input: {
  userId: string;
  from: Date;
  to: Date;
  providers?: string[];
}): Promise<ExchangeFinancialEvent[]> {
  const records = await prisma.exchangeImportRecord.findMany({
    where: {
      userId: input.userId,
      occurredAt: {
        gte: input.from,
        lte: input.to,
      },
      provider: input.providers?.length
        ? { in: input.providers }
        : { in: ["BINANCE", "BINANCE_TAX"] },
    },
    orderBy: {
      occurredAt: "asc",
    },
    include: {
      movement: true,
    },
  });

  return records.map((record) => {
    const normalized = JSON.parse(record.normalizedJson ?? "{}") as NormalizedPayload;

    const asset      = normalized.symbol   ?? record.movement?.symbol   ?? "UNKNOWN";
    const quantity   = Number(normalized.quantity  ?? record.movement?.quantity  ?? 0);
    const priceUsd   = Number(normalized.priceUsd  ?? record.movement?.priceUsd  ?? 0);
    const feeUsd     = Number(normalized.feeUsd    ?? record.movement?.feeUsd    ?? 0);

    return {
      provider:            record.provider,
      externalId:          record.externalId,
      eventType:           record.normalizedEventType ?? "UNKNOWN",
      portfolioMovementId: record.movementId,
      occurredAt:          record.occurredAt,
      asset,
      quantity,
      priceUsd,
      feeUsd,
      estimatedUsd:        quantity * priceUsd,
      taxTreatment:        record.taxTreatment,
      inventoryEffect:     record.inventoryEffect,
      economicEffect:      record.economicEffect,
    };
  });
}
