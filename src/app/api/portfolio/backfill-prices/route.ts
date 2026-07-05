import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { ok, fail, serverError } from "@/shared/apiResponse";
import { fetchHistoricalCryptoPrice } from "@/modules/integrations/binance/application/fetchHistoricalCryptoPrice";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const movements = await prisma.portfolioMovement.findMany({
      where: {
        userId:    auth.user.id,
        type:      { in: ["DEPOSIT", "WITHDRAW"] },
        priceUsd:  0,
        deletedAt: null,
      },
      select: { id: true, symbol: true, executedAt: true },
    });

    if (movements.length === 0) {
      return ok({ updated: 0 }, "No hay movimientos con precio pendiente.");
    }

    let updated = 0;
    const errors: string[] = [];

    for (const m of movements) {
      try {
        const price = await fetchHistoricalCryptoPrice(m.symbol, m.executedAt);
        if (price > 0) {
          await prisma.portfolioMovement.update({
            where: { id: m.id },
            data:  { priceUsd: price },
          });
          updated++;
        }
      } catch (e) {
        errors.push(`${m.symbol} ${m.executedAt.toISOString()}: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    return ok({ updated, total: movements.length, errors }, `${updated} de ${movements.length} precios actualizados.`);
  } catch (error) {
    return serverError(error);
  }
}
