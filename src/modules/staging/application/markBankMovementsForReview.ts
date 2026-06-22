import { prisma } from "@/lib/prisma";
import { logBankReconciliationAudit } from "@/modules/banking/application/logBankReconciliationAudit";
import { syncBankStagingEvent } from "./upsertStagingEvent";
import { StagingError } from "../domain/StagingError";

export type MarkBankMovementForReviewInput = {
  bankMovementId: string;
  userId:         string;
};

export type MarkBankMovementForReviewResult = {
  bankMovementId: string;
  status:         "REVIEW";
};

export async function markBankMovementForReview(
  input: MarkBankMovementForReviewInput,
): Promise<MarkBankMovementForReviewResult> {
  const { bankMovementId, userId } = input;

  const movement = await prisma.bankMovement.findUnique({ where: { id: bankMovementId } });

  if (!movement || movement.userId !== userId) {
    throw new StagingError("BANK_MOVEMENT_NOT_FOUND");
  }
  if (movement.status === "MATCHED") {
    throw new StagingError("ALREADY_MATCHED");
  }
  if (movement.status === "REVIEW") {
    return { bankMovementId, status: "REVIEW" };
  }

  await prisma.bankMovement.update({
    where: { id: bankMovementId },
    data:  { status: "REVIEW" },
  });

  await logBankReconciliationAudit({
    userId,
    action:         "STAGING_REVIEW",
    bankMovementId,
    reason:         "Marcado para revisión desde bandeja de importaciones",
  });

  await syncBankStagingEvent(bankMovementId, "REVIEW");

  return { bankMovementId, status: "REVIEW" };
}
