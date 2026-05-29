import { prisma } from "@/lib/prisma";
import { getExchangeAdapter } from "./exchangeAdapterRegistry";
import type { ExchangeProvider } from "./ExchangeProvider";
import type { ExchangeCredentials, SyncPeriodResult } from "./ExchangeAdapter";

export type SyncExchangePeriodInput = {
  userId:       string;
  connectionId: string;
  provider:     ExchangeProvider;
  credentials:  ExchangeCredentials;
  from:         Date;
  to:           Date;
};

export async function syncExchangePeriod(input: SyncExchangePeriodInput): Promise<SyncPeriodResult> {
  const adapter = getExchangeAdapter(input.provider);

  const rawRecords = await adapter.fetchRaw({
    userId:      input.userId,
    credentials: input.credentials,
    from:        input.from,
    to:          input.to,
  });

  let synced  = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of rawRecords) {
    try {
      const normalized = adapter.normalize(raw);
      if (!normalized) { skipped++; continue; }

      const existing = await prisma.exchangeImportRecord.findUnique({
        where: {
          userId_provider_externalId: {
            userId:     input.userId,
            provider:   input.provider,
            externalId: normalized.externalId,
          },
        },
      });

      if (existing) { skipped++; continue; }

      await prisma.exchangeImportRecord.create({
        data: {
          userId:              input.userId,
          connectionId:        input.connectionId,
          provider:            input.provider,
          externalId:          normalized.externalId,
          externalType:        normalized.externalType,
          rawPayload:          JSON.stringify(raw.rawPayload),
          normalizedJson:      normalized.normalizedJson,
          normalizedEventType: normalized.normalizedEventType,
          taxTreatment:        normalized.taxTreatment,
          inventoryEffect:     normalized.inventoryEffect,
          economicEffect:      normalized.economicEffect,
          status:              "PENDING",
          occurredAt:          normalized.occurredAt,
        },
      });

      synced++;
    } catch (err) {
      errors.push(`${raw.externalId}: ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }
  }

  return { provider: input.provider, synced, skipped, errors };
}
