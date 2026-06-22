import { prisma } from "@/lib/prisma";

export async function rejectBankMatch(
  userId: string,
  bankMovementId: string,
): Promise<void> {
  await prisma.bankMovement.update({
    where: { id: bankMovementId, userId },
    data: { status: "IGNORED" },
  });
}
