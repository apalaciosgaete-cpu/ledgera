import { prisma } from "@/lib/prisma";

export type AuditAction = "MATCH_CONFIRMED" | "MATCH_REJECTED" | "MATCH_UNMATCHED";

export async function logReconciliationAudit(params: {
  userId:               string;
  action:               AuditAction;
  bankMovementId:       string;
  portfolioMovementId?: string | null;
  confidence?:          number | null;
  reason?:              string | null;
  metadata?:            Record<string, unknown> | null;
}): Promise<void> {
  await prisma.bankReconciliationAuditLog.create({
    data: {
      userId:              params.userId,
      action:              params.action,
      bankMovementId:      params.bankMovementId,
      portfolioMovementId: params.portfolioMovementId ?? null,
      confidence:          params.confidence ?? null,
      reason:              params.reason ?? null,
      metadata:            params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
