import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AssistantStage =
  | "EMPTY"
  | "IMPORT_REVIEW"
  | "DATA_REVIEW"
  | "TAX_REVIEW"
  | "READY_TO_REPORT"
  | "REPORT_READY";

type NextAction = {
  title: string;
  detail: string;
  href: string;
  label: string;
};

function buildNextAction(params: {
  stage: AssistantStage;
  pendingImports: number;
  movementReview: number;
  movementCount: number;
  sellCount: number;
  declarationIsCurrent: boolean;
}): NextAction {
  switch (params.stage) {
    case "EMPTY":
      return {
        title: "Incorpora tus operaciones",
        detail: "Conecta un exchange o carga un archivo para que LEDGERA pueda construir tus activos y evaluar tu situación tributaria.",
        href: "/importaciones",
        label: "Comenzar en Importaciones",
      };
    case "IMPORT_REVIEW":
      return {
        title: "Revisa las operaciones importadas",
        detail: `Tienes ${params.pendingImports} ${params.pendingImports === 1 ? "registro pendiente" : "registros pendientes"} de confirmación o revisión.`,
        href: "/importaciones",
        label: "Revisar operaciones",
      };
    case "DATA_REVIEW":
      return {
        title: "Completa los antecedentes faltantes",
        detail: `Hay ${params.movementReview} ${params.movementReview === 1 ? "operación" : "operaciones"} con precio o clasificación pendiente.`,
        href: "/importaciones",
        label: "Resolver pendientes",
      };
    case "TAX_REVIEW":
      return {
        title: "Revisa el análisis tributario",
        detail: params.sellCount > 0
          ? `LEDGERA detectó ${params.sellCount} ${params.sellCount === 1 ? "venta" : "ventas"}. Revisa resultado, costos y observaciones antes de generar el respaldo.`
          : "Tus datos ya permiten revisar el resultado tributario preliminar.",
        href: "/obligaciones-tributarias",
        label: "Ver estado tributario",
      };
    case "REPORT_READY":
      return {
        title: params.declarationIsCurrent ? "Tu respaldo está actualizado" : "Actualiza tu respaldo",
        detail: params.declarationIsCurrent
          ? "Ya existe un respaldo posterior a tus últimas operaciones registradas. Puedes revisarlo o descargarlo nuevamente."
          : "Se registraron operaciones después del último respaldo. Conviene generar una nueva versión.",
        href: "/declaraciones",
        label: params.declarationIsCurrent ? "Ver respaldos" : "Actualizar respaldo",
      };
    case "READY_TO_REPORT":
    default:
      return {
        title: "Genera tu respaldo",
        detail: `Tienes ${params.movementCount} ${params.movementCount === 1 ? "operación preparada" : "operaciones preparadas"} y no se detectan pendientes operativos.`,
        href: "/declaraciones",
        label: "Generar respaldo",
      };
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  // El asistente siempre consulta únicamente la cuenta autenticada, incluso si el usuario es administrador.
  const userId = auth.user.id;

  try {
    const [
      movementCount,
      movementReview,
      movementTypes,
      assetSymbols,
      latestMovement,
      pendingImports,
      confirmedImports,
      importCount,
      connections,
      taxEventCount,
      latestAnnualSummary,
      latestDeclaration,
      declarationCount,
    ] = await Promise.all([
      prisma.portfolioMovement.count({ where: { userId, deletedAt: null } }),
      prisma.portfolioMovement.count({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { priceUsd: { lte: 0 } },
            { appliedTaxCategory: null, suggestedTaxCategory: "UNCLASSIFIED" },
          ],
        },
      }),
      prisma.portfolioMovement.groupBy({
        by: ["type"],
        where: { userId, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.portfolioMovement.findMany({
        where: { userId, deletedAt: null },
        distinct: ["symbol"],
        select: { symbol: true },
      }),
      prisma.portfolioMovement.findFirst({
        where: { userId, deletedAt: null },
        orderBy: { executedAt: "desc" },
        select: { executedAt: true },
      }),
      prisma.exchangeImportRecord.count({
        where: { userId, status: { in: ["PENDING", "REVIEW"] } },
      }),
      prisma.exchangeImportRecord.count({ where: { userId, status: "CONFIRMED" } }),
      prisma.exchangeImportRecord.count({ where: { userId } }),
      prisma.exchangeConnection.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { exchange: true, status: true, lastSyncAt: true },
      }),
      prisma.taxEvent.count({ where: { userId } }),
      prisma.annualTaxSummary.findFirst({
        where: { userId },
        orderBy: [{ taxYear: "desc" }, { updatedAt: "desc" }],
        select: {
          taxYear: true,
          reviewCount: true,
          taxableEventCount: true,
          netTaxableGainClp: true,
          preliminaryTaxBaseClp: true,
          updatedAt: true,
        },
      }),
      prisma.taxDeclaration.findFirst({
        where: { userId, voidedAt: null },
        orderBy: { generatedAt: "desc" },
        select: {
          taxYear: true,
          declarationType: true,
          status: true,
          generatedAt: true,
        },
      }),
      prisma.taxDeclaration.count({ where: { userId, voidedAt: null } }),
    ]);

    const typeCounts = new Map(
      movementTypes.map((row) => [String(row.type).trim().toUpperCase(), row._count._all]),
    );
    const sellCount = typeCounts.get("SELL") ?? 0;
    const buyCount = typeCounts.get("BUY") ?? 0;
    const stakingCount =
      (typeCounts.get("STAKING_REWARD") ?? 0) +
      (typeCounts.get("STAKING") ?? 0) +
      (typeCounts.get("REWARD") ?? 0);

    const declarationIsCurrent = Boolean(
      latestDeclaration &&
        (!latestMovement || latestDeclaration.generatedAt.getTime() >= latestMovement.executedAt.getTime()),
    );

    let stage: AssistantStage;
    if (movementCount === 0 && importCount === 0) stage = "EMPTY";
    else if (pendingImports > 0) stage = "IMPORT_REVIEW";
    else if (movementReview > 0) stage = "DATA_REVIEW";
    else if (latestDeclaration) stage = "REPORT_READY";
    else if (sellCount > 0 || stakingCount > 0 || taxEventCount > 0 || latestAnnualSummary) stage = "TAX_REVIEW";
    else stage = "READY_TO_REPORT";

    const taxStatus = latestAnnualSummary
      ? latestAnnualSummary.reviewCount > 0
        ? "REVIEW"
        : latestAnnualSummary.netTaxableGainClp > 0 || latestAnnualSummary.preliminaryTaxBaseClp > 0
          ? "POSSIBLE_PAYMENT"
          : latestAnnualSummary.taxableEventCount > 0
            ? "DECLARE"
            : "NO_TAX_EVENTS"
      : sellCount > 0 || stakingCount > 0
        ? "REVIEW"
        : "NO_TAX_EVENTS";

    const nextAction = buildNextAction({
      stage,
      pendingImports,
      movementReview,
      movementCount,
      sellCount,
      declarationIsCurrent,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          generatedAt: new Date().toISOString(),
          stage,
          nextAction,
          counts: {
            movements: movementCount,
            buys: buyCount,
            sells: sellCount,
            staking: stakingCount,
            assets: assetSymbols.length,
            movementReview,
            imports: importCount,
            pendingImports,
            confirmedImports,
            taxEvents: taxEventCount,
            declarations: declarationCount,
          },
          tax: {
            year: latestAnnualSummary?.taxYear ?? latestDeclaration?.taxYear ?? null,
            status: taxStatus,
            reviewCount: latestAnnualSummary?.reviewCount ?? movementReview,
            taxableEventCount: latestAnnualSummary?.taxableEventCount ?? taxEventCount,
            netTaxableGainClp: latestAnnualSummary?.netTaxableGainClp ?? null,
            preliminaryTaxBaseClp: latestAnnualSummary?.preliminaryTaxBaseClp ?? null,
            updatedAt: latestAnnualSummary?.updatedAt.toISOString() ?? null,
          },
          latestDeclaration: latestDeclaration
            ? {
                taxYear: latestDeclaration.taxYear,
                declarationType: latestDeclaration.declarationType,
                status: latestDeclaration.status,
                generatedAt: latestDeclaration.generatedAt.toISOString(),
                isCurrent: declarationIsCurrent,
              }
            : null,
          exchanges: connections.map((connection) => ({
            exchange: connection.exchange,
            status: connection.status,
            lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { ok: false, message: "No fue posible obtener el contexto del asistente.", debug: { message } },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}
