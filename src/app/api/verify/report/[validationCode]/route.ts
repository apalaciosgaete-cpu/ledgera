// src/app/api/verify/report/[validationCode]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ validationCode: string }>;
};

function getReportTypeLabel(type: string): string {
  switch (type) {
    case "STRICT_TAX_REPORT":      return "Reporte tributario para contador";
    case "INFORMATIVE_TAX_REPORT": return "Borrador informativo tributario";
    case "STRICT_TAX_CSV":         return "Reporte contador CSV";
    case "INFORMATIVE_TAX_CSV":    return "Borrador informativo CSV";
    case "AUDIT_TRAIL_PDF":        return "Trazabilidad de auditoría (PDF)";
    case "AUDIT_TRAIL_CSV":        return "Trazabilidad de auditoría (CSV)";
    default:                       return "Reporte LEDGERA";
  }
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    year:   "numeric",
    month:  "2-digit",
    day:    "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(value);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { validationCode } = await context.params;

    if (!validationCode || validationCode.length < 16) {
      return NextResponse.json(
        { ok: false, message: "Código de validación inválido.", data: null },
        { status: 400 }
      );
    }

    // El campo único ahora es `hash` no `validationCode`
    const report = await prisma.reportValidation.findUnique({
      where: { hash: validationCode },
    });

    if (!report) {
      return NextResponse.json(
        { ok: false, message: "Reporte no encontrado o código inválido.", data: null },
        { status: 404 }
      );
    }

    const isRevoked = Boolean(report.revokedAt);

    return NextResponse.json({
      ok:      true,
      message: isRevoked ? "El reporte existe, pero fue revocado." : "Reporte validado correctamente.",
      data: {
        validationCode: report.hash,
        type:           report.type,
        typeLabel:      getReportTypeLabel(report.type),
        isValid:        !isRevoked,
        issuedAt:       report.issuedAt.toISOString(),
        issuedAtLabel:  formatDate(report.issuedAt),
        year:           report.year,
        symbol:         report.symbol,
        revokedAt:      report.revokedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[verify/report]", error);
    return NextResponse.json(
      { ok: false, message: "No fue posible validar el reporte.", data: null },
      { status: 500 }
    );
  }
}