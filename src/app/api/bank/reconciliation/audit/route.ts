import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(request.url);
    const bankMovementId = searchParams.get("bankMovementId");
    const action         = searchParams.get("action");

    const logs = await prisma.bankReconciliationAuditLog.findMany({
      where: {
        userId: auth.user.id,
        ...(bankMovementId ? { bankMovementId } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    if (logs.length === 0) {
      return ok({ logs: [], total: 0 }, "0 eventos de auditoría encontrados.");
    }

    const bankIds      = [...new Set(logs.map(l => l.bankMovementId))];
    const portfolioIds = [...new Set(
      logs.map(l => l.portfolioMovementId).filter((id): id is string => id !== null),
    )];

    const [bankMovements, portfolioMovements] = await Promise.all([
      prisma.bankMovement.findMany({ where: { id: { in: bankIds } } }),
      portfolioIds.length > 0
        ? prisma.portfolioMovement.findMany({ where: { id: { in: portfolioIds } } })
        : Promise.resolve([]),
    ]);

    const bankById      = new Map(bankMovements.map(m => [m.id, m]));
    const portfolioById = new Map(portfolioMovements.map(m => [m.id, m]));

    const enriched = logs.map(log => {
      const bank      = bankById.get(log.bankMovementId) ?? null;
      const portfolio = log.portfolioMovementId
        ? portfolioById.get(log.portfolioMovementId) ?? null
        : null;

      return {
        id:         log.id,
        action:     log.action,
        confidence: log.confidence ?? null,
        reason:     log.reason ?? null,
        createdAt:  log.createdAt.toISOString(),
        bankMovement: bank ? {
          id:          bank.id,
          bankName:    bank.bankName ?? null,
          occurredAt:  bank.occurredAt.toISOString(),
          description: bank.description,
          amountClp:   bank.amountClp,
          direction:   bank.direction,
        } : null,
        portfolioMovement: portfolio ? {
          id:         portfolio.id,
          type:       portfolio.type,
          symbol:     portfolio.symbol,
          quantity:   portfolio.quantity,
          priceUsd:   portfolio.priceUsd,
          executedAt: portfolio.executedAt.toISOString(),
          source:     portfolio.source ?? null,
        } : null,
      };
    });

    return ok(
      { logs: enriched, total: enriched.length },
      `${enriched.length} eventos de auditoría encontrados.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
