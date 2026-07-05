// src/app/api/tax/periods/reopen/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";
import { createTaxPeriodAuditLog } from "@/modules/tax/infrastructure/taxPeriodAuditLogRepository";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
type ReopenBody = {
  year?: number | string;
  reopenReason?: string;
};

export async function POST(request: NextRequest) {
  const csrfResponse = enforceCsrfProtection(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const currentUser = await getUserById(auth.user.id);

  if (!currentUser) {
    return fail("Usuario no encontrado.", 404);
  }

  const subscriptionCheck = requireActiveSubscription(currentUser);

  if (!subscriptionCheck.ok) {
    return subscriptionCheck.response;
  }

  try {
    const body = (await request.json()) as ReopenBody;
    const year = Number(body.year);
    const reopenReason = String(body.reopenReason ?? "").trim();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail("Año inválido.", 400);
    }

    if (!reopenReason) {
      return fail("El motivo de reapertura es obligatorio.", 400);
    }

    const closure = await prisma.taxPeriodClose.findUnique({
      where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
    });

    if (!closure) return fail("El período no está cerrado.", 404);
    if (closure.reopenedAt) return fail("El período ya fue reabierto.", 409);

    const reopened = await prisma.taxPeriodClose.update({
      where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
      data: {
        status: "REOPENED",
        reopenedAt: new Date(),
        closedReason: `${closure.closedReason ?? ""}\nReapertura: ${reopenReason}`.trim(),
      },
    });

    await createTaxPeriodAuditLog({
      year,
      action: "REOPEN",
      reason: reopenReason,
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      metadata: {
        source: "api/tax/periods/reopen",
        statusBefore: closure.status,
        statusAfter: "REOPENED",
        closedAt: closure.closedAt.toISOString(),
        reopenedAt: reopened.reopenedAt?.toISOString() ?? null,
      },
    });

    return ok(
      {
        year,
        status: reopened.status,
        closedAt: reopened.closedAt,
        reopenedAt: reopened.reopenedAt,
        reason: reopenReason,
      },
      "Período tributario reabierto correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}