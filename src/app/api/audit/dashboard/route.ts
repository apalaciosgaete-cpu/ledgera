// src/app/api/audit/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const scope = buildUserScopeWhere(auth.user);
    const year = new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const [
      closure,
      rawMovements,
      taxEvents,
      declarations,
      snapshots,
      validations,
      periodLogs,
      declarationLogs,
    ] = await Promise.all([
      prisma.taxPeriodClose.findUnique({
        where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
      }),
      prisma.portfolioMovement.findMany({
        where: { deletedAt: null, ...scope },
        select: { id: true, type: true, priceUsd: true, quantity: true, executedAt: true },
      }),
      prisma.taxEvent.findMany({
        where: { taxYear: year, ...scope },
        select: { id: true, movementId: true, effectiveTaxCategory: true },
      }),
      prisma.taxDeclaration.findMany({
        where: { userId: auth.user.id },
        select: { id: true, taxYear: true, status: true, declarationType: true, contentHash: true, generatedAt: true },
        orderBy: { generatedAt: "desc" },
        take: 20,
      }),
      prisma.taxPeriodSnapshot.findMany({
        where: { userId: auth.user.id, year },
        select: { id: true, contentHash: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reportValidation.findMany({
        where: { userId: auth.user.id },
        select: { id: true, hash: true, type: true, issuedAt: true, year: true, revokedAt: true },
        orderBy: { issuedAt: "desc" },
        take: 20,
      }),
      prisma.taxPeriodAuditLog.findMany({
        where: { userId: auth.user.id, year },
        select: { id: true, action: true, reason: true, actorEmail: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.taxDeclarationAuditLog.findMany({
        where: { userId: auth.user.id },
        select: { id: true, action: true, declarationId: true, actorEmail: true, statusFrom: true, statusTo: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

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
      if (type === "SELL" && !eventMovementIds.has(m.id)) sellWithoutEvent++;
      if (type !== "BUY" && type !== "SELL" && type !== "DEPOSIT" && type !== "WITHDRAW" && type !== "STAKING_REWARD") unknownTypeCount++;
      if (m.priceUsd === null || Number(m.priceUsd) <= 0) missingPriceCount++;
      if (m.quantity === null || Number(m.quantity) <= 0) missingQuantityCount++;
      if (m.executedAt && new Date(m.executedAt) > now) futureDateCount++;
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

    const periodStatus: "OPEN" | "CLOSED" | "REOPENED" = !closure
      ? "OPEN"
      : closure.reopenedAt
        ? "REOPENED"
        : "CLOSED";

    const declarationCounts = {
      total: declarations.length,
      draft: declarations.filter((d) => d.status === "DRAFT").length,
      reviewed: declarations.filter((d) => d.status === "REVIEWED").length,
      confirmed: declarations.filter((d) => d.status === "CONFIRMED").length,
      voided: declarations.filter((d) => d.status === "VOIDED").length,
      exported: declarations.filter((d) => d.status === "EXPORTED").length,
    };

    return NextResponse.json({
      ok: true,
      data: {
        year,
        integrity: {
          healthScore,
          status: healthScore >= 90 ? "Excelente" : healthScore >= 70 ? "Bueno" : healthScore >= 40 ? "Requiere revisión" : "Crítico",
          color: healthScore >= 90 ? "#166534" : healthScore >= 70 ? "#0F766E" : healthScore >= 40 ? "#854D0E" : "#991B1B",
          issues: {
            sellWithoutEvent,
            orphanEvents,
            unknownTypeCount,
            missingPriceCount,
            missingQuantityCount,
            futureDateCount,
            pendingEvents,
          },
          totalIssues: sellWithoutEvent + orphanEvents + unknownTypeCount + missingPriceCount + missingQuantityCount + futureDateCount + pendingEvents,
        },
        period: {
          year,
          status: periodStatus,
          closedAt: closure?.closedAt ?? null,
          reopenedAt: closure?.reopenedAt ?? null,
          closedReason: closure?.closedReason ?? null,
          snapshotCount: snapshots.length,
          logCount: periodLogs.length,
        },
        declarations: {
          counts: declarationCounts,
          recent: declarations.slice(0, 5).map((d) => ({
            id: d.id,
            taxYear: d.taxYear,
            type: d.declarationType,
            status: d.status,
            hash: d.contentHash,
            generatedAt: d.generatedAt,
          })),
        },
        movements: {
          total: rawMovements.length,
          inYear: rawMovements.filter((m) => m.executedAt && new Date(m.executedAt) >= startOfYear && new Date(m.executedAt) <= endOfYear).length,
        },
        events: {
          total: taxEvents.length,
          pendingEvents,
        },
        validations: {
          total: validations.length,
          valid: validations.filter((v) => !v.revokedAt).length,
          revoked: validations.filter((v) => v.revokedAt).length,
          recent: validations.slice(0, 5).map((v) => ({
            id: v.id,
            hash: v.hash,
            type: v.type,
            year: v.year,
            issuedAt: v.issuedAt,
          })),
        },
        snapshots: snapshots.map((s) => ({
          id: s.id,
          contentHash: s.contentHash,
          createdAt: s.createdAt,
        })),
        recentLogs: {
          period: periodLogs,
          declarations: declarationLogs,
        },
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al cargar dashboard de auditoría", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
