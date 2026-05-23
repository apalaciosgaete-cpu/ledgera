import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { logReconciliationAudit } from "@/modules/banking/application/logReconciliationAudit";

type Body = {
  bankMovementId?: string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body           = (await request.json()) as Body;
    const bankMovementId = body.bankMovementId?.trim();

    if (!bankMovementId) {
      return fail("bankMovementId es obligatorio.", 400);
    }

    const movement = await prisma.bankMovement.findUnique({
      where: { id: bankMovementId },
    });

    if (!movement || movement.userId !== auth.user.id) {
      return fail("Movimiento bancario no encontrado.", 404);
    }

    if (movement.status !== "MATCHED") {
      return fail("Solo se puede deshacer una conciliación confirmada.", 409);
    }

    const previousPortfolioMovementId = movement.matchedPortfolioMovementId;

    const updated = await prisma.bankMovement.update({
      where: { id: movement.id },
      data: {
        status:                     "IMPORTED",
        matchedPortfolioMovementId: null,
        matchedConfidence:          null,
        matchedAt:                  null,
        matchedReason:              null,
      },
    });

    await logReconciliationAudit({
      userId:              auth.user.id,
      action:              "MATCH_UNMATCHED",
      bankMovementId:      updated.id,
      portfolioMovementId: previousPortfolioMovementId,
      confidence:          movement.matchedConfidence,
      reason:              movement.matchedReason,
      metadata:            { previousStatus: "MATCHED", revertedAt: new Date().toISOString() },
    });

    return ok(
      {
        bankMovementId: updated.id,
        status:         updated.status,
      },
      "Conciliación deshecha correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
