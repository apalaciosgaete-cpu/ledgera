import { prisma } from "@/lib/prisma";
import { logBankReconciliationAudit } from "./logBankReconciliationAudit";

type AutoConfirmBankMatchInput = {
  userId: string;
  bankMovementId: string;
  portfolioMovementId: string;
  confidence: number;
  reason: string;
};

type AutoConfirmBankMatchResult = {
  ok: boolean;
  skipped: boolean;
  reason: string;
};

export async function autoConfirmBankMatch(
  input: AutoConfirmBankMatchInput,
): Promise<AutoConfirmBankMatchResult> {
  const confidence = Number(input.confidence);

  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return {
      ok: false,
      skipped: true,
      reason: "Confidence inválida.",
    };
  }

  const [bankMovement, portfolioMovement] = await Promise.all([
    prisma.bankMovement.findUnique({
      where: { id: input.bankMovementId },
    }),
    prisma.portfolioMovement.findUnique({
      where: { id: input.portfolioMovementId },
    }),
  ]);

  if (!bankMovement || bankMovement.userId !== input.userId) {
    return {
      ok: false,
      skipped: true,
      reason: "Movimiento bancario no encontrado.",
    };
  }

  if (!portfolioMovement || portfolioMovement.userId !== input.userId) {
    return {
      ok: false,
      skipped: true,
      reason: "Movimiento crypto no encontrado.",
    };
  }

  if (!["IMPORTED", "REVIEW"].includes(bankMovement.status)) {
    return {
      ok: false,
      skipped: true,
      reason: `Movimiento bancario en estado ${bankMovement.status}.`,
    };
  }

  const updated = await prisma.bankMovement.update({
    where: { id: bankMovement.id },
    data: {
      status: "MATCHED",
      matchedPortfolioMovementId: portfolioMovement.id,
      matchedConfidence: confidence,
      matchedAt: new Date(),
      matchedReason: `[AUTO] ${input.reason}`,
    },
  });

  await logBankReconciliationAudit({
    userId: input.userId,
    action: "AUTO_MATCHED",
    bankMovementId: updated.id,
    portfolioMovementId: portfolioMovement.id,
    confidence,
    reason: `[AUTO] ${input.reason}`,
  });

  return {
    ok: true,
    skipped: false,
    reason: "Conciliación automática aplicada.",
  };
}
