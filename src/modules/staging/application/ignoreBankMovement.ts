import {
  findBankMovementsByIds,
  updateBankMovementsToIgnored,
} from "../infrastructure/stagingRepository";
import {
  writeBankIgnoreAudit,
  writeBankIgnoreAuditBatch,
} from "../infrastructure/stagingAuditRepository";
import { findUnmatchedBankMovementIds } from "./findBankMatchCandidates";
import { StagingError } from "../domain/StagingError";

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

  const result = await updateBankMovementsToIgnored(bankMovementIds, userId);

  await writeBankIgnoreAudit(userId, {
    userId,
    bankMovementIds,
    beforeStatuses,
    afterStatus: "IGNORED",
    ...(reason ? { reason } : {}),
  });

  return { rejected: result.count, bankMovementIds };
}

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
