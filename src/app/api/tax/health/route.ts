import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function scoreLabel(score: number): { label: string; color: string; icon: string } {
  if (score >= 90) return { label: "Excelente", color: "#166534", icon: "✓" };
  if (score >= 70) return { label: "Bueno", color: "#0F766E", icon: "✓" };
  if (score >= 40) return { label: "Requiere revisión", color: "#854D0E", icon: "!" };
  return { label: "Crítico", color: "#991B1B", icon: "⚠" };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const scope = buildUserScopeWhere(auth.user);

    const [rawMovements, taxEvents] = await Promise.all([
      prisma.portfolioMovement.findMany({
        where: { deletedAt: null, ...scope },
        orderBy: { executedAt: "asc" },
        select: {
          id: true,
          type: true,
          symbol: true,
          quantity: true,
          priceUsd: true,
          executedAt: true,
        },
      }),
      prisma.taxEvent.findMany({
        where: { ...scope },
        select: { id: true, movementId: true },
      }),
    ]);

    const eventMovementIds = new Set(taxEvents.map((e) => e.movementId));
    const movementIds = new Set(rawMovements.map((m) => m.id));
    const orphanEvents = taxEvents.filter((e) => !movementIds.has(e.movementId)).length;

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
      if (type !== "BUY" && type !== "SELL" && type !== "DEPOSIT" && type !== "WITHDRAW" && type !== "STAKING_REWARD") {
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

    let score = 100;
    score -= sellWithoutEvent * 10;
    score -= orphanEvents * 10;
    score -= unknownTypeCount * 5;
    score -= missingPriceCount * 5;
    score -= missingQuantityCount * 5;
    score -= futureDateCount * 3;
    score = Math.max(0, score);

    const token = scoreLabel(score);

    const problems: { severity: "high" | "medium" | "low"; label: string; detail: string }[] = [];
    if (sellWithoutEvent > 0) {
      problems.push({
        severity: sellWithoutEvent > 3 ? "high" : "medium",
        label: `${sellWithoutEvent} venta${sellWithoutEvent > 1 ? "s" : ""} sin evento tributario`,
        detail: "Hay ventas que no generaron un evento tributario. Esto puede deberse a datos incompletos o a un error en el cálculo.",
      });
    }
    if (orphanEvents > 0) {
      problems.push({
        severity: "high",
        label: `${orphanEvents} evento${orphanEvents > 1 ? "s" : ""} huérfano${orphanEvents > 1 ? "s" : ""}`,
        detail: "Hay eventos tributarios que no tienen un movimiento asociado. Revisa si se eliminaron movimientos.",
      });
    }
    if (unknownTypeCount > 0) {
      problems.push({
        severity: "medium",
        label: `${unknownTypeCount} movimiento${unknownTypeCount > 1 ? "s" : ""} con tipo desconocido`,
        detail: "Algunos movimientos tienen un tipo que LEDGERA no reconoce. Clasifícalos como Compra, Venta o Staking.",
      });
    }
    if (missingPriceCount > 0) {
      problems.push({
        severity: "medium",
        label: `${missingPriceCount} movimiento${missingPriceCount > 1 ? "s" : ""} sin precio`,
        detail: "Falta el precio USD en algunos movimientos. Sin precio no se puede calcular la ganancia ni el impuesto.",
      });
    }
    if (missingQuantityCount > 0) {
      problems.push({
        severity: "medium",
        label: `${missingQuantityCount} movimiento${missingQuantityCount > 1 ? "s" : ""} sin cantidad`,
        detail: "Hay movimientos con cantidad en cero o vacía. Revisa que todos los movimientos tengan cantidad.",
      });
    }
    if (futureDateCount > 0) {
      problems.push({
        severity: "low",
        label: `${futureDateCount} movimiento${futureDateCount > 1 ? "s" : ""} con fecha futura`,
        detail: "Algunos movimientos tienen fecha posterior a hoy. Revisa que las fechas sean correctas.",
      });
    }

    const recommendations: string[] = [];
    if (sellWithoutEvent > 0) recommendations.push("Revisa las ventas sin evento en la sección Revisión.");
    if (orphanEvents > 0) recommendations.push("Elimina o regenera los eventos huérfanos desde el panel de configuración.");
    if (unknownTypeCount > 0) recommendations.push("Clasifica los movimientos con tipo desconocido como Compra, Venta o Staking.");
    if (missingPriceCount > 0) recommendations.push("Completa el precio USD de los movimientos faltantes.");
    if (missingQuantityCount > 0) recommendations.push("Revisa los movimientos con cantidad en cero.");
    if (futureDateCount > 0) recommendations.push("Corrige las fechas futuras en los movimientos.");
    if (problems.length === 0) recommendations.push("Tus datos tributarios están en buen estado. Sigue cargando movimientos regularmente.");

    return NextResponse.json({
      ok: true,
      data: {
        score,
        label: token.label,
        color: token.color,
        icon: token.icon,
        totalMovements: rawMovements.length,
        totalEvents: taxEvents.length,
        sellWithoutEvent,
        orphanEvents,
        unknownTypeCount,
        missingPriceCount,
        missingQuantityCount,
        futureDateCount,
        problems,
        recommendations,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al calcular salud tributaria", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
