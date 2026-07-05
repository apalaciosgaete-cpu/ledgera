// src/app/api/report-validations/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function getReportTypeLabel(type: string): string {
  switch (type) {
    case "STRICT_TAX_REPORT":      return "PDF verificable (contador / SII)";
    case "INFORMATIVE_TAX_REPORT": return "PDF borrador informativo";
    case "STRICT_TAX_CSV":         return "CSV para contador";
    case "INFORMATIVE_TAX_CSV":    return "CSV borrador informativo";
    case "AUDIT_TRAIL_PDF":        return "Trazabilidad de auditoría (PDF)";
    case "AUDIT_TRAIL_CSV":        return "Trazabilidad de auditoría (CSV)";
    default:                       return "Reporte LEDGERA";
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);
    if (!auth) return fail("No autorizado.", 401);

    const yearParam = request.nextUrl.searchParams.get("year");
    const year      = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail("Año inválido.", 400);
    }

    const validations = await prisma.reportValidation.findMany({
      where:   { userId: auth.user.id, year },
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