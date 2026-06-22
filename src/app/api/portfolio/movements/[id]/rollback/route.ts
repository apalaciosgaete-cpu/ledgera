import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { getAuditRequestContext } from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { prisma } from "@/lib/prisma";
import { createStableSha256Hash } from "@/shared/hash";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { id }    = await params;
    const userId    = auth.user.id;
    const body      = await request.json() as { reason?: string };
    const reason    = body.reason ?? "Reversión de movimiento de portafolio";

    const pm = await prisma.portfolioMovement.findFirst({ where: { id, userId, deletedAt: null } });
    if (!pm) return fail("Movimiento no encontrado.", 404);

    const prevState = {
      type: pm.type, symbol: pm.symbol, quantity: pm.quantity,
      priceUsd: pm.priceUsd, executedAt: pm.executedAt.toISOString(), source: pm.source,
    };

    await prisma.portfolioMovement.update({
      where: { id },
      data:  { deletedAt: new Date(), deletedReason: reason },
    });

    const ctx = getAuditRequestContext(request);
    await prisma.logicalRollback.create({
      data: {
        userId,
        entityType:      "PORTFOLIO",
        entityId:        id,
        rollbackReason:  reason,
        rollbackPayload: JSON.stringify(prevState),
        actorId:         auth.user.id,
        actorEmail:      auth.user.email,
      },
    });

    return ok(
      { entityType: "PORTFOLIO", entityId: id, prevStatus: "ACTIVE", newStatus: "DELETED" },
      "Movimiento revertido.",
    );
  } catch (error) {
    return serverError(error);
  }
}
