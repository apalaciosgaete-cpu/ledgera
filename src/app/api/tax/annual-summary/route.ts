import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { prisma } from "@/lib/prisma";

function resolveYear(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2009 && parsed <= 2100 ? parsed : undefined;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const { searchParams } = new URL(req.url);
    const taxYear = resolveYear(searchParams.get("year"));

    const summaries = await prisma.annualTaxSummary.findMany({
      where: {
        userId: auth.user.id,
        ...(taxYear ? { taxYear } : {}),
      },
      orderBy: { taxYear: "desc" },
    });

    const message = summaries.length > 0
      ? `${summaries.length} resúmen(es) anual(es) tributario(s).`
      : "No hay resúmenes anuales. Usa /rebuild para generarlos.";

    return ok({ summaries, taxYear: taxYear ?? null }, message);
  } catch (error) {
    return serverError(error);
  }
}
