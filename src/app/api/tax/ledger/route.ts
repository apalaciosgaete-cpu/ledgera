import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { prisma } from "@/lib/prisma";

function resolveYear(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2009 && parsed <= 2100 ? parsed : undefined;
}

function resolveLimit(value: string | null): number {
  const parsed = Number(value ?? "500");
  if (!Number.isFinite(parsed)) return 500;
  return Math.min(Math.max(parsed, 1), 1000);
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(req.url);
    const taxYear = resolveYear(searchParams.get("year"));
    const limit   = resolveLimit(searchParams.get("limit"));

    const rawEntries = await prisma.taxLedgerEntry.findMany({
      where: {
        userId: auth.user.id,
        ...(taxYear ? { taxYear } : {}),
      },
      include: {
        taxEvent: { select: { executedAt: true } },
      },
      orderBy: [{ taxYear: "desc" }, { taxMonth: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const entries = rawEntries.map((e) => ({
      id:                e.id,
      taxYear:           e.taxYear,
      taxMonth:          e.taxMonth,
      executedAt:        e.taxEvent?.executedAt?.toISOString() ?? null,
      ledgerType:        e.ledgerType,
      ledgerCategory:    e.ledgerCategory,
      assetSymbol:       e.assetSymbol,
      quantity:          e.quantity,
      proceedsClp:       e.proceedsClp,
      costBasisClp:      e.costBasisClp,
      realizedGainClp:   e.realizedGainClp,
      taxTreatment:      e.taxTreatment,
      siiClassification: e.siiClassification,
      source:            e.source,
      movementId:        e.movementId,
      taxEventId:        e.taxEventId,
      createdAt:         e.createdAt.toISOString(),
    }));

    // Totales agregados por año para KPIs del cliente
    const byYear: Record<number, {
      proceedsClp: number;
      costBasisClp: number;
      realizedGainClp: number;
      count: number;
    }> = {};

    for (const e of entries) {
      byYear[e.taxYear] ??= { proceedsClp: 0, costBasisClp: 0, realizedGainClp: 0, count: 0 };
      byYear[e.taxYear].proceedsClp    += e.proceedsClp;
      byYear[e.taxYear].costBasisClp   += e.costBasisClp;
      byYear[e.taxYear].realizedGainClp += e.realizedGainClp;
      byYear[e.taxYear].count++;
    }

    return ok(
      { entries, totals: byYear, taxYear: taxYear ?? null },
      `${entries.length} asientos del ledger tributario.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
