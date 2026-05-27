import { prisma } from "@/lib/prisma";

type BankReconciliationAuditAction =
  | "MATCH_CONFIRMED"
  | "MATCH_REJECTED"
  | "MATCH_UNMATCHED"
  | "AUTO_MATCHED"
  | "STAGING_IGNORED"
  | "STAGING_REVIEW"
  | "BANK_IMPORT_REJECTED";

type LogBankReconciliationAuditInput = {
  userId:               string;
  action:               BankReconciliationAuditAction;
  bankMovementId:       string;
  portfolioMovementId?: string | null;
  confidence?:          number | null;
  reason?:              string | null;
  metadata?:            Record<string, unknown>;
};

export async function logBankReconciliationAudit(
  input: LogBankReconciliationAuditInput,
): Promise<void> {
  await prisma.bankReconciliationAuditLog.create({
    data: {
      userId:              input.userId,
      action:              input.action,
      bankMovementId:      input.bankMovementId,
      portfolioMovementId: input.portfolioMovementId ?? null,
      confidence:          input.confidence ?? null,
      reason:              input.reason ?? null,
      metadata:            input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
