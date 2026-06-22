import { prisma } from "@/lib/prisma";
import { STAGING_SOURCE } from "../domain/StagingSource";

// ── Exchange write-through ─────────────────────────────────────────────────────
// Called after confirm/reject to sync status into StagingEvent.

export async function syncExchangeStagingEvent(
  recordId: string,
  newStatus: string,
): Promise<void> {
  const source = await prisma.stagingEventSource.findFirst({
    where:  { recordId },
    select: { stagingEventId: true, stagingEvent: { select: { linkedMovementId: true } } },
  });
  if (!source) return;

  // If confirmed, also fetch the latest movementId from the record
  const record = newStatus === "CONFIRMED"
    ? await prisma.exchangeImportRecord.findUnique({
        where:  { id: recordId },
        select: { movementId: true },
      })
    : null;

  await prisma.stagingEvent.update({
    where: { id: source.stagingEventId },
    data: {
      status:          newStatus,
      ...(record?.movementId ? { linkedMovementId: record.movementId } : {}),
    },
  });
}

// ── Bank write-through ────────────────────────────────────────────────────────
// Called after bank status changes (match confirm, ignore, review).

export async function syncBankStagingEvent(
  bankMovementId: string,
  newStatus:      string,
  linkedMovementId?: string | null,
): Promise<void> {
  const source = await prisma.stagingEventSource.findFirst({
    where:  { recordId: bankMovementId, stagingEvent: { source: STAGING_SOURCE.BANK } },
    select: { stagingEventId: true },
  });
  if (!source) return;

  await prisma.stagingEvent.update({
    where: { id: source.stagingEventId },
    data: {
      status: newStatus,
      ...(linkedMovementId !== undefined ? { linkedMovementId: linkedMovementId ?? null } : {}),
    },
  });
}
