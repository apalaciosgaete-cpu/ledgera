import { prisma } from "@/lib/prisma";

export async function confirmBankMatch(
  userId: string,
  bankMovementId: string,
  portfolioMovementId: string,
  confidence: number,
  reason: string,
): Promise<void> {
  await prisma.bankMovement.update({
    where: { id: bankMovementId, userId },
    data: {
      matchedPortfolioMovementId: portfolioMovementId,
      matchedConfidence: confidence,
      matchedAt: new Date(),
      matchedReason: reason,
      status: "MATCHED",
    },
  });
}
