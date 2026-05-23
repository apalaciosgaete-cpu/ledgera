import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { logBankReconciliationAudit } from "@/modules/banking/application/logBankReconciliationAudit";

type RejectBody = {
  bankMovementId?: string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body           = (await request.json()) as RejectBody;
    const bankMovementId = body.bankMovementId?.trim();

    if (!bankMovementId) {
      return fail("bankMovementId es obligatorio.", 400);
    }

    const bankMovement = await prisma.bankMovement.findUnique({
      where: { id: bankMovementId },
    });

    if (!bankMovement || bankMovement.userId !== auth.user.id) {
      return fail("Movimiento bancario no encontrado.", 404);
    }

    if (bankMovement.status === "MATCHED") {
      return fail("No puedes ignorar un movimiento ya conciliado.", 409);
    }

    const updated = await prisma.bankMovement.update({
      where: { id: bankMovement.id },
      data: {
        status:                     "IGNORED",
        matchedPortfolioMovementId: null,
        matchedConfidence:          null,
        matchedAt:                  null,
        matchedReason:              null,
      },
    });

    await logBankReconciliationAudit({
      userId:         auth.user.id,
      action:         "MATCH_REJECTED",
      bankMovementId: updated.id,
      reason:         "Sugerencia ignorada por usuario",
    });

    return ok(
      {
        bankMovementId: updated.id,
        status:         updated.status,
      },
      "Sugerencia ignorada correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
