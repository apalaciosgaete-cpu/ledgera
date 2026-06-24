// src/app/api/tax/assistant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";
import { buildTaxObligationsAssistant } from "@/modules/tax/application/buildTaxObligationsAssistant";

function isPendingCategory(value: string | null | undefined) {
  const category = String(value ?? "").trim().toUpperCase();
  return category === "" || category === "PENDING" || category === "UNCLASSIFIED" || category === "SIN_CLASIFICAR";
}

function buildTaxHealth(params: { totalEvents: number; pendingCount: number }) {
  const { totalEvents, pendingCount } = params;
  if (totalEvents === 0) return null;

  const issues = pendingCount > 0
    ? [{ type: "PENDING_REVIEW", count: pendingCount, message: "Hay eventos que necesitan revisión del usuario." }]
    : [];

  const score = Math.max(0, Math.min(100, 100 - pendingCount * 20));
  const status = score < 60 ? "RISK" : issues.length > 0 ? "REVIEW" : "OK";

  return { status, score, issues } as const;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const events = await prisma.taxEvent.findMany({
      where: buildUserScopeWhere(auth.user),
      orderBy: [{ executedAt: "desc" }, { id: "desc" }],
      take: 100,
      select: {
        eventType: true,
        symbol: true,
        executedAt: true,
        quantity: true,
        effectiveTaxCategory: true,
        realizedPnlClp: true,
        proceedsGrossClp: true,
        costBasisClp: true,
      },
    });

    const totalEvents = events.length;
    const pendingCount = events.filter((event) => isPendingCategory(event.effectiveTaxCategory)).length;
    const taxHealth = buildTaxHealth({ totalEvents, pendingCount });

    const assistant = buildTaxObligationsAssistant({
      events,
      totalEvents,
      pendingCount,
      taxHealth,
    });

    return ok(assistant, "Guía de Obligaciones Tributarias cargada");
  } catch (error) {
    return serverError(error);
  }
}
