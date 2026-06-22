import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/shared/apiResponse";

export async function GET() {
  try {
    const movimientos = await prisma.portfolioMovement.findMany({
      where: {
        deletedAt: null,
        OR: [
          { appliedTaxCategory: null },
          { suggestedTaxCategory: "UNCLASSIFIED" },
        ],
      },
      orderBy: { executedAt: "asc" },
      select: {
        id:                      true,
        type:                    true,
        symbol:                  true,
        quantity:                true,
        priceUsd:                true,
        feeUsd:                  true,
        executedAt:              true,
        suggestedTaxCategory:    true,
        appliedTaxCategory:      true,
        taxClassificationSource: true,
      },
    });

    return ok(movimientos, `${movimientos.length} movimientos pendientes.`);
  } catch (error) {
    return serverError(error);
  }
}