import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { logReconciliationAudit } from "@/modules/banking/application/logReconciliationAudit";

type ConfirmBody = {
  bankMovementId?:      string;
  portfolioMovementId?: string;
  confidence?:          number;
  reason?:              string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as ConfirmBody;

    const bankMovementId      = body.bankMovementId?.trim();
    const portfolioMovementId = body.portfolioMovementId?.trim();
    const confidence          = Number(body.confidence ?? 0);
    const reason              = body.reason?.trim() ?? null;

    if (!bankMovementId || !portfolioMovementId) {
      return fail("bankMovementId y portfolioMovementId son obligatorios.", 400);
    }

    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return fail("confidence debe estar entre 0 y 1.", 400);
    }

    const [bankMovement, portfolioMovement] = await Promise.all([
      prisma.bankMovement.findUnique({ where: { id: bankMovementId } }),
      prisma.portfolioMovement.findUnique({ where: { id: portfolioMovementId } }),
    ]);

    if (!bankMovement || bankMovement.userId !== auth.user.id) {
      return fail("Movimiento bancario no encontrado.", 404);
    }

    if (!portfolioMovement || portfolioMovement.userId !== auth.user.id) {
      return fail("Movimiento crypto no encontrado.", 404);
    }

    if (bankMovement.status === "MATCHED") {
      return fail("El movimiento bancario ya está conciliado.", 409);
    }

    const updated = await prisma.bankMovement.update({
      where: { id: bankMovement.id },
      data: {
        status:                     "MATCHED",
        matchedPortfolioMovementId: portfolioMovement.id,
        matchedConfidence:          confidence,
        matchedAt:                  new Date(),
        matchedReason:              reason,
      },
    });

    await logReconciliationAudit({
      userId:              auth.user.id,
      action:              "MATCH_CONFIRMED",
      bankMovementId:      updated.id,
      portfolioMovementId: portfolioMovement.id,
      confidence,
      reason,
    });

    return ok(
      {
        bankMovementId:      updated.id,
        portfolioMovementId: portfolioMovement.id,
        status:              updated.status,
      },
      "Conciliación confirmada correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
