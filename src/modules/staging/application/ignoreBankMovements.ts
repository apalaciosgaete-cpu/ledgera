import { prisma } from "@/lib/prisma";
import { logBankReconciliationAudit } from "@/modules/banking/application/logBankReconciliationAudit";
import {
  findBankMovementsByIds,
  updateBankMovementsToIgnored,
} from "../infrastructure/stagingRepository";
import {
  writeBankIgnoreAudit,
  writeBankIgnoreAuditBatch,
} from "../infrastructure/stagingAuditRepository";
import { findUnmatchedBankMovementIds } from "./findBankMatchCandidates";
import { syncBankStagingEvent } from "./upsertStagingEvent";
import { StagingError } from "../domain/StagingError";

// ── Single ignore (from staging bandeja) ─────────────────────────────────────
// Clears match fields + logs with STAGING_IGNORED action

export type IgnoreSingleBankMovementInput = {
  bankMovementId: string;
  reason?:        string;
  userId:         string;
};

export type IgnoreSingleBankMovementResult = {
  bankMovementId: string;
  status:         "IGNORED";
};

export async function ignoreSingleBankMovement(
  input: IgnoreSingleBankMovementInput,
): Promise<IgnoreSingleBankMovementResult> {
  const { bankMovementId, reason, userId } = input;

  const movement = await prisma.bankMovement.findUnique({ where: { id: bankMovementId } });

  if (!movement || movement.userId !== userId) {
    throw new StagingError("BANK_MOVEMENT_NOT_FOUND");
  }
  if (movement.status === "MATCHED") {
    throw new StagingError("ALREADY_MATCHED");
  }
  if (movement.status === "IGNORED") {
    return { bankMovementId, status: "IGNORED" };
  }

  await prisma.bankMovement.update({
    where: { id: bankMovementId },
    data: {
      status:                     "IGNORED",
      matchedPortfolioMovementId: null,
      matchedConfidence:          null,
      matchedAt:                  null,
      matchedReason:              null,
    },
  });

  await logBankReconciliationAudit({
    userId,
    action:         "STAGING_IGNORED",
    bankMovementId,
    reason:         reason ?? "Ignorado desde bandeja de importaciones",
  });

  await syncBankStagingEvent(bankMovementId, "REJECTED");

  return { bankMovementId, status: "IGNORED" };
}

// ── Bulk ignore (from bank/reject — multi-select) ─────────────────────────────
// Uses decision hash audit; does not clear match fields (movements are IMPORTED/REVIEW)

export type IgnoreBankMovementsInput = {
  bankMovementIds: string[];
  reason?:         string;
  userId:          string;
};

export type IgnoreBankMovementsResult = {
  rejected:        number;
  bankMovementIds: string[];
};

export async function ignoreBankMovements(
  input: IgnoreBankMovementsInput,
): Promise<IgnoreBankMovementsResult> {
  const { bankMovementIds, reason, userId } = input;

  const existing = await findBankMovementsByIds(bankMovementIds, userId);
  if (existing.length !== bankMovementIds.length) {
    throw new StagingError("NOT_FOUND");
  }

  const beforeStatuses = Object.fromEntries(existing.map((m) => [m.id, m.status]));
  const result         = await updateBankMovementsToIgnored(bankMovementIds, userId);

  await writeBankIgnoreAudit(userId, {
    userId,
    bankMovementIds,
    beforeStatuses,
    afterStatus: "IGNORED",
    ...(reason ? { reason } : {}),
  });

  for (const id of bankMovementIds) {
    await syncBankStagingEvent(id, "REJECTED");
  }

  return { rejected: result.count, bankMovementIds };
}

// ── Auto-ignore unmatched (batch) ─────────────────────────────────────────────

export async function ignoreUnmatchedBankMovements(
  userId: string,
): Promise<{ ignored: number }> {
  const toIgnore = await findUnmatchedBankMovementIds(userId);
  if (toIgnore.length === 0) return { ignored: 0 };

  await updateBankMovementsToIgnored(toIgnore, userId);
  await writeBankIgnoreAuditBatch(
    userId,
    toIgnore,
    "Ignorado en batch por no tener candidatos de conciliación",
  );

  return { ignored: toIgnore.length };
}
