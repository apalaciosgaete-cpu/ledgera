import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function clp(n: number): string {
  return Math.round(n).toString();
}

function resolveYear(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2009 && parsed <= 2100 ? parsed : undefined;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth || auth instanceof NextResponse) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const taxYear = resolveYear(searchParams.get("year"));

    const entries = await prisma.taxLedgerEntry.findMany({
      where: {
        userId: auth.user.id,
        ...(taxYear ? { taxYear } : {}),
      },
      include: { taxEvent: { select: { executedAt: true } } },
      orderBy: [{ taxYear: "asc" }, { taxMonth: "asc" }, { createdAt: "asc" }],
    });

    const HEADER = [
      "Año tributario",
      "Mes",
      "Fecha operación",
      "Activo",
      "Cantidad",
      "Tipo evento",
      "Categoría",
      "Ingresos brutos CLP",
      "Costo tributario CLP",
      "Mayor valor CLP",
      "Clasificación SII",
      "Tratamiento",
      "Origen",
    ].join(";");

    const rows = entries.map((e) =>
      [
        e.taxYear.toString(),
        e.taxMonth.toString().padStart(2, "0"),
        e.taxEvent?.executedAt?.toISOString().slice(0, 10)
          ?? `${e.taxYear}-${e.taxMonth.toString().padStart(2, "0")}-01`,
        e.assetSymbol,
        e.quantity.toFixed(8),
        e.ledgerType,
        e.ledgerCategory,
        clp(e.proceedsClp),
        clp(e.costBasisClp),
        clp(e.realizedGainClp),
        e.siiClassification,
        e.taxTreatment,
        e.source,
      ]
        .map(String)
        .map(escapeCsv)
        .join(";"),
    );

    const csv = "﻿" + [HEADER, ...rows].join("\n");
    const filename = taxYear
      ? `ledger-tributario-${taxYear}.csv`
      : `ledger-tributario-completo.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[ledger/export/csv]", error);
    return new NextResponse("Error al generar CSV", { status: 500 });
  }
}
