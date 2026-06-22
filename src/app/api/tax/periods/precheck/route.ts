// src/app/api/tax/periods/precheck/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const yearParam = request.nextUrl.searchParams.get("year");
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail("Año inválido.", 400);
    }

    const scope = buildUserScopeWhere(auth.user);

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const [
      closure,
      rawMovements,
      taxEvents,
      annualSummary,
    ] = await Promise.all([
      prisma.taxPeriodClose.findUnique({
        where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
      }),
      prisma.portfolioMovement.findMany({
        where: {
          deletedAt: null,
          ...scope,
          executedAt: { gte: startOfYear, lte: endOfYear },
        },
        select: {
          id: true,
          type: true,
          priceUsd: true,
          quantity: true,
          executedAt: true,
        },
      }),
      prisma.taxEvent.findMany({
        where: { taxYear: year, ...scope },
        select: {
          id: true,
          movementId: true,
          effectiveTaxCategory: true,
          realizedPnlUsd: true,
          realizedPnlClp: true,
        },
      }),
      prisma.annualTaxSummary.findUnique({
        where: { userId_taxYear: { userId: auth.user.id, taxYear: year } },
      }),
    ]);

    const isClosed = Boolean(closure && !closure.reopenedAt);
    const status: "OPEN" | "CLOSED" | "REOPENED" = !closure
      ? "OPEN"
      : closure.reopenedAt
        ? "REOPENED"
        : "CLOSED";

    const eventMovementIds = new Set(taxEvents.map((e) => e.movementId));
    const movementIds = new Set(rawMovements.map((m) => m.id));

    let sellWithoutEvent = 0;
    let unknownTypeCount = 0;
    let missingPriceCount = 0;
    let missingQuantityCount = 0;
    let futureDateCount = 0;
    const now = new Date();

    for (const m of rawMovements) {
      const type = String(m.type).trim().toUpperCase();
      if (type === "SELL" && !eventMovementIds.has(m.id)) {
        sellWithoutEvent += 1;
      }
      if (
        type !== "BUY" &&
        type !== "SELL" &&
        type !== "DEPOSIT" &&
        type !== "WITHDRAW" &&
        type !== "STAKING_REWARD"
      ) {
        unknownTypeCount += 1;
      }
      if (m.priceUsd === null || Number(m.priceUsd) <= 0) {
        missingPriceCount += 1;
      }
      if (m.quantity === null || Number(m.quantity) <= 0) {
        missingQuantityCount += 1;
      }
      if (m.executedAt && new Date(m.executedAt) > now) {
        futureDateCount += 1;
      }
    }

    const orphanEvents = taxEvents.filter((e) => !movementIds.has(e.movementId)).length;
    const pendingEvents = taxEvents.filter(
      (e) => !e.effectiveTaxCategory || e.effectiveTaxCategory === "UNCLASSIFIED"
    ).length;

    let healthScore = 100;
    healthScore -= sellWithoutEvent * 10;
    healthScore -= orphanEvents * 10;
    healthScore -= unknownTypeCount * 5;
    healthScore -= missingPriceCount * 5;
    healthScore -= missingQuantityCount * 5;
    healthScore -= futureDateCount * 3;
    healthScore = Math.max(0, healthScore);

    const totalPnlClp = taxEvents.reduce((sum, e) => sum + (e.realizedPnlClp ?? 0), 0);
    const totalPnlUsd = taxEvents.reduce((sum, e) => sum + (e.realizedPnlUsd ?? 0), 0);

    const preconditions = [
      {
        key: "health",
        label: "Datos en buen estado",
        description: `Salud tributaria ${healthScore >= 70 ? "suficiente" : "insuficiente"} para cerrar`,
        passed: healthScore >= 70,
        value: `${healthScore}/100`,
      },
      {
        key: "pendingEvents",
        label: "Sin eventos pendientes",
        description: pendingEvents > 0 ? `${pendingEvents} evento${pendingEvents > 1 ? "s" : ""} sin clasificar` : "Todos los eventos están clasificados",
        passed: pendingEvents === 0,
        value: String(pendingEvents),
      },
      {
        key: "sellWithoutEvent",
        label: "Sin ventas sin evento",
        description: sellWithoutEvent > 0 ? `${sellWithoutEvent} venta${sellWithoutEvent > 1 ? "s" : ""} sin evento tributario` : "Todas las ventas generaron evento",
        passed: sellWithoutEvent === 0,
        value: String(sellWithoutEvent),
      },
      {
        key: "baseCalculated",
        label: "Base imponible calculada",
        description: annualSummary ? "Resumen anual disponible" : "Sin resumen anual generado",
        passed: Boolean(annualSummary),
        value: annualSummary ? "Sí" : "No",
      },
    ];

    const readyToClose = status === "OPEN" && preconditions.every((p) => p.passed);

    return ok({
      year,
      status,
      isClosed,
      closedAt: closure?.closedAt ?? null,
      reopenedAt: closure?.reopenedAt ?? null,
      closedReason: closure?.closedReason ?? null,
      preconditions,
      readyToClose,
      summary: {
        totalMovements: rawMovements.length,
        totalTaxEvents: taxEvents.length,
        pendingEvents,
        sellWithoutEvent,
        orphanEvents,
        healthScore,
        totalPnlClp,
        totalPnlUsd,
        baseImponibleClp: annualSummary?.netTaxableGainClp ?? 0,
        impuestoEstimadoClp: annualSummary?.preliminaryTaxBaseClp ?? 0,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al verificar precondiciones", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
