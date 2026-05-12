// src/app/api/report-validations/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "").trim();
  }
  return request.cookies.get("session_token")?.value ?? null;
}

function getReportTypeLabel(type: string): string {
  switch (type) {
    case "STRICT_TAX_REPORT":      return "PDF verificable (contador / SII)";
    case "INFORMATIVE_TAX_REPORT": return "PDF borrador informativo";
    case "STRICT_TAX_CSV":         return "CSV para contador";
    case "INFORMATIVE_TAX_CSV":    return "CSV borrador informativo";
    default:                       return "Reporte LEDGERA";
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return fail("No autorizado.", 401);

    const yearParam = request.nextUrl.searchParams.get("year");
    const year      = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail("Año inválido.", 400);
    }

    const validations = await prisma.reportValidation.findMany({
      where:   { year },
      orderBy: { issuedAt: "desc" },
    });

    return ok({
      year,
      validations: validations.map((v) => ({
        id:              v.id,
        hash:            v.hash,
        type:            v.type,
        typeLabel:       getReportTypeLabel(v.type),
        isValid:         !v.revokedAt,
        issuedAt:        v.issuedAt.toISOString(),
        symbol:          v.symbol,
        revokedAt:       v.revokedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}