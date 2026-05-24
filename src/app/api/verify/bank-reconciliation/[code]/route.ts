import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

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
    const { code } = await context.params;

    if (!code || code.length < 4) {
      return NextResponse.json(
        { ok: false, message: "Código de verificación inválido.", data: null },
        { status: 400 },
      );
    }

    const record = await prisma.bankReconciliationReportValidation.findUnique({
      where: { validationCode: code.toUpperCase() },
    });

    if (!record) {
      return NextResponse.json(
        { ok: false, message: "Reporte no encontrado o código inválido.", data: null },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok:      true,
      message: "Reporte de conciliación verificado correctamente.",
      data: {
        validationCode: record.validationCode,
        contentHash:    record.contentHash,
        reportType:     record.reportType,
        isValid:        true,
        issuedAt:       record.createdAt.toISOString(),
        issuedAtLabel:  formatDate(record.createdAt),
      },
    });
  } catch (error) {
    console.error("[verify/bank-reconciliation]", error);
    return NextResponse.json(
      { ok: false, message: "No fue posible verificar el reporte.", data: null },
      { status: 500 },
    );
  }
}
