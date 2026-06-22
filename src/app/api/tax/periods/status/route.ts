// src/app/api/tax/periods/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const yearParam = request.nextUrl.searchParams.get("year");
    const year      = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail("Año inválido.", 400);
    }

    const closure = await prisma.taxPeriodClose.findUnique({
      where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
    });

    const isClosed = Boolean(closure && !closure.reopenedAt);
    const status   = !closure ? "OPEN" : closure.reopenedAt ? "REOPENED" : "CLOSED";

    return ok({
      year,
      status,
      isClosed,
      closedAt:     closure?.closedAt     ?? null,
      reopenedAt:   closure?.reopenedAt   ?? null,
      closedReason: closure?.closedReason ?? null,
    });
  } catch (error) {
    return serverError(error);
  }
}