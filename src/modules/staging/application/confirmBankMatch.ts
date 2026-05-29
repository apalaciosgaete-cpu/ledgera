import {
  findBankMovementById,
  findPortfolioMovementById,
  updateBankMovementMatch,
} from "../infrastructure/stagingRepository";
import { writeBankMatchConfirmAudit } from "../infrastructure/stagingAuditRepository";
import { syncBankStagingEvent } from "./upsertStagingEvent";
import { StagingError } from "../domain/StagingError";

export type ConfirmBankMatchInput = {
  bankMovementId:      string;
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  userId:              string;
};

export type ConfirmBankMatchResult = {
  bankMovementId:      string;
  portfolioMovementId: string;
  status:              "MATCHED";
};

export async function confirmBankMatch(
  input: ConfirmBankMatchInput,
): Promise<ConfirmBankMatchResult> {
  const { bankMovementId, portfolioMovementId, confidence, reason, userId } = input;

  const bankMovement = await findBankMovementById(bankMovementId, userId);
  if (!bankMovement)                      throw new StagingError("BANK_MOVEMENT_NOT_FOUND");
  if (bankMovement.status === "MATCHED")  throw new StagingError("ALREADY_MATCHED");
  if (bankMovement.status === "IGNORED")  throw new StagingError("ALREADY_IGNORED");

  const pm = await findPortfolioMovementById(portfolioMovementId, userId);
  if (!pm) throw new StagingError("PORTFOLIO_MOVEMENT_NOT_FOUND");

  await updateBankMovementMatch(bankMovementId, portfolioMovementId, confidence, reason);

  await writeBankMatchConfirmAudit(userId, {
    userId,
    bankMovementId,
    portfolioMovementId,
    confidence,
    reason,
    beforeStatus: bankMovement.status,
    afterStatus:  "MATCHED",
  });

  await syncBankStagingEvent(bankMovementId, "CONFIRMED", portfolioMovementId);

  return { bankMovementId, portfolioMovementId, status: "MATCHED" };
}
