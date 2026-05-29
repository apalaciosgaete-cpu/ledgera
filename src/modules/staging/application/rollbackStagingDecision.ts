import { prisma } from "@/lib/prisma";
import type { StagingActor } from "../domain/StagingEvent";
import { StagingError } from "../domain/StagingError";

export type RollbackStagingInput = {
  stagingEventId?: string;
  exchangeRecordId?: string;
  bankMovementId?: string;
  reason:          string;
  actor:           StagingActor;
};

export type RollbackStagingResult = {
  entityType: string;
  entityId:   string;
  prevStatus: string;
  newStatus:  "PENDING";
};

export async function rollbackStagingDecision(
  input: RollbackStagingInput,
): Promise<RollbackStagingResult> {
  const { actor, reason } = input;
  const userId = actor.id;

  // ── Exchange record rollback ───────────────────────────────────────────────
  if (input.exchangeRecordId) {
    const record = await prisma.exchangeImportRecord.findFirst({
      where: { id: input.exchangeRecordId, userId },
    });
    if (!record) throw new StagingError("NOT_FOUND");

    const prevStatus = record.status;
    await prisma.exchangeImportRecord.update({
      where: { id: record.id },
      data:  { status: "PENDING", movementId: null },
    });

    await prisma.logicalRollback.create({
      data: {
        userId,
        entityType:      "STAGING_EXCHANGE",
        entityId:        record.id,
        rollbackReason:  reason,
        rollbackPayload: JSON.stringify({ prevStatus, recordId: record.id }),
        actorId:         actor.id,
        actorEmail:      actor.email,
      },
    });

    return { entityType: "STAGING_EXCHANGE", entityId: record.id, prevStatus, newStatus: "PENDING" };
  }

  // ── Bank movement rollback ─────────────────────────────────────────────────
  if (input.bankMovementId) {
    const bm = await prisma.bankMovement.findFirst({
      where: { id: input.bankMovementId, userId },
    });
    if (!bm) throw new StagingError("BANK_MOVEMENT_NOT_FOUND");

    const prevStatus = bm.status;
    await prisma.bankMovement.update({
      where: { id: bm.id },
      data:  {
        status:                     "IMPORTED",
        matchedPortfolioMovementId: null,
        matchedConfidence:          null,
        matchedReason:              null,
        matchedAt:                  null,
      },
    });

    await prisma.logicalRollback.create({
      data: {
        userId,
        entityType:      "BANK",
        entityId:        bm.id,
        rollbackReason:  reason,
        rollbackPayload: JSON.stringify({ prevStatus, bankMovementId: bm.id }),
        actorId:         actor.id,
        actorEmail:      actor.email,
      },
    });

    return { entityType: "BANK", entityId: bm.id, prevStatus, newStatus: "PENDING" };
  }

  throw new StagingError("NOT_FOUND");
}
