// src/app/api/tax/periods/close/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";
import { createTaxPeriodSnapshot } from "@/modules/tax/infrastructure/taxPeriodSnapshotRepository";
import { createTaxPeriodAuditLog } from "@/modules/tax/infrastructure/taxPeriodAuditLogRepository";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";

type CloseBody = {
  year?: number | string;
  closedReason?: string;
};

type TaxEventLite = {
  id: string;
  movementId: string;
  effectiveTaxCategory: string;
  realizedPnlUsd: number | null;
  realizedPnlClp: number | null;
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
    const body = (await request.json()) as CloseBody;
    const year = Number(body.year);
    const closedReason = String(body.closedReason ?? "").trim();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail("Año inválido.", 400);
    }

    if (!closedReason) {
      return fail("El motivo de cierre es obligatorio.", 400);
    }

    const existingClosure = await prisma.taxPeriodClose.findUnique({
      where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
    });

    if (existingClosure && !existingClosure.reopenedAt) {
      return fail("El período ya está cerrado.", 409);
    }

    const sellMovements = await prisma.portfolioMovement.findMany({
      where: {
        userId: auth.user.id,
        deletedAt: null,
        type: "SELL",
        executedAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
    });

    const totalSellMovements = sellMovements.length;

    const taxEvents = await prisma.taxEvent.findMany({
      where: {
        userId: auth.user.id,
        taxYear: year,
      },
      select: {
        id: true,
        movementId: true,
        effectiveTaxCategory: true,
        realizedPnlUsd: true,
        realizedPnlClp: true,
      },
    });

    const totalTaxEvents = taxEvents.length;

    const pendingEvents = taxEvents.filter(
      (event) =>
        !event.effectiveTaxCategory ||
        event.effectiveTaxCategory === "UNCLASSIFIED",
    );

    const snapshotPayload = {
      year,
      userId: auth.user.id,
      totals: {
        totalSellMovements,
        totalTaxEvents,
        totalPnlUsd: taxEvents.reduce(
          (acc: number, event: TaxEventLite) =>
            acc + (event.realizedPnlUsd ?? 0),
          0,
        ),
        totalPnlClp: taxEvents.reduce(
          (acc: number, event: TaxEventLite) =>
            acc + (event.realizedPnlClp ?? 0),
          0,
        ),
      },
      events: taxEvents.map((event: TaxEventLite) => ({
        id: event.id,
        movementId: event.movementId,
        effectiveTaxCategory: event.effectiveTaxCategory,
        realizedPnlUsd: event.realizedPnlUsd,
        realizedPnlClp: event.realizedPnlClp,
      })),
    };

    const snapshot = await createTaxPeriodSnapshot({ year, snapshotPayload });

    const closure = await prisma.taxPeriodClose.upsert({
      where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
      update: {
        status: "CLOSED",
        closedReason,
        closedAt: new Date(),
        reopenedAt: null,
      },
      create: {
        userId: auth.user.id,
        periodYear: year,
        status: "CLOSED",
        closedReason,
      },
    });

    await createTaxPeriodAuditLog({
      year,
      action: "CLOSE",
      reason: closedReason,
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      metadata: {
        source: "api/tax/periods/close",
        statusAfter: "CLOSED",
        closedAt: closure.closedAt?.toISOString(),
        snapshotHash: snapshot.contentHash,
        totalSellMovements,
        totalTaxEvents,
        pendingEvents: pendingEvents.length,
      },
    });

    return ok(
      {
        year,
        status: closure.status,
        closedAt: closure.closedAt,
        closedReason: closure.closedReason,
        snapshotHash: snapshot.contentHash,
        summary: {
          totalSellMovements,
          totalTaxEvents,
          pendingEvents: pendingEvents.length,
        },
      },
      "Período tributario cerrado correctamente.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}