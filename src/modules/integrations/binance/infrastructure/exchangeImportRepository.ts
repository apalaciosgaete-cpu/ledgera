import { prisma } from "@/lib/prisma";
import type { NormalizedImportRecord } from "../domain/binanceTypes";

export async function upsertImportRecord(
  userId:       string,
  connectionId: string,
  provider:     string,
  raw:          NormalizedImportRecord,
  rawPayload:   string,
): Promise<{ isNew: boolean }> {
  const existing = await prisma.exchangeImportRecord.findUnique({
    where: { userId_provider_externalId: { userId, provider, externalId: raw.externalId } },
  });

  if (existing) return { isNew: false };

  await prisma.exchangeImportRecord.create({
    data: {
      userId,
      connectionId,
      provider,
      externalId:          raw.externalId,
      externalType:        raw.externalType,
      rawPayload,
      normalizedJson:      JSON.stringify(raw),
      normalizedEventType: raw.normalizedEventType,
      taxTreatment:        raw.taxTreatment,
      inventoryEffect:     raw.inventoryEffect,
      economicEffect:      raw.economicEffect,
      status:              "PENDING",
      occurredAt:          raw.occurredAt,
    },
  });

  return { isNew: true };
}

export async function listPendingImports(userId: string, provider?: string) {
  return prisma.exchangeImportRecord.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "REVIEW"] },
      ...(provider ? { provider } : {}),
    },
    orderBy: { occurredAt: "asc" },
  });
}

export async function confirmImport(
  recordId:   string,
  userId:     string,
  movementId: string,
) {
  return prisma.exchangeImportRecord.update({
    where: { id: recordId, userId },
    data:  { status: "CONFIRMED", movementId },
  });
}

export async function rejectImport(recordId: string, userId: string) {
  return prisma.exchangeImportRecord.update({
    where: { id: recordId, userId },
    data:  { status: "REJECTED" },
  });
}

export async function markImportAsReview(recordId: string, userId: string) {
  return prisma.exchangeImportRecord.update({
    where: { id: recordId, userId },
    data:  { status: "REVIEW" },
  });
}

export async function countPendingImports(userId: string): Promise<number> {
  return prisma.exchangeImportRecord.count({
    where: { userId, status: { in: ["PENDING", "REVIEW"] } },
  });
}
