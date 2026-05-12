import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/shared";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TaxEventRow = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: Date;
  quantity: number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  usdClp: number;
  proceedsGrossClp: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

const FINAL_TAX_CATEGORIES = new Set([
  "ORDINARY_INCOME",
  "CAPITAL_GAIN",
  "NON_TAXABLE",
]);

function round(value: number, decimals = 8): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

function buildExecutedAtRange(year?: string | null) {
  if (!year) return null;

  const y = Number(year);

  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    return null;
  }

  return {
    gte: new Date(`${y}-01-01T00:00:00.000Z`),
    lt: new Date(`${y + 1}-01-01T00:00:00.000Z`),
  };
}

function translateCategory(cat: string | null) {
  switch (normalizeCategory(cat || "UNCLASSIFIED")) {
    case "ORDINARY_INCOME":
      return "Renta ordinaria";
    case "CAPITAL_GAIN":
      return "Mayor valor";
    case "NON_TAXABLE":
      return "No afecto";
    default:
      return "Sin clasificar";
  }
}

function escapeCsv(value: unknown) {
  const normalized = value ?? "";
  const str = String(normalized);

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function buildFilename(year: string | null, symbol: string | null) {
  const safeYear = year ? year.trim() : "all";
  const safeSymbol = symbol ? symbol.trim().toUpperCase() : "all";

  return `ledgera-borrador-revision-${safeYear}-${safeSymbol}.csv`;
}

function evaluateInformativeContext(events: TaxEventRow[]) {
  const pendingCount = events.filter((event) => {
    const category = normalizeCategory(event.effectiveTaxCategory);
    return !FINAL_TAX_CATEGORIES.has(category);
  }).length;

  const riskCount = events.filter((event) => {
    const category = normalizeCategory(event.effectiveTaxCategory);
    return category === "ORDINARY_INCOME";
  }).length;

  return {
    pendingCount,
    riskCount,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado.", data: null },
      { status: 401 },
    );
  }

  const currentUser = await getUserById(auth.user.id);

  if (!currentUser) {
    return NextResponse.json(
      { ok: false, message: "Usuario no encontrado.", data: null },
      { status: 404 },
    );
  }

  const subscriptionCheck = requireActiveSubscription(currentUser);

  if (!subscriptionCheck.ok) {
    return subscriptionCheck.response;
  }

  try {
    const { searchParams } = new URL(req.url);

    const year = searchParams.get("year");
    const rawSymbol = searchParams.get("symbol");
    const symbol = rawSymbol ? normalizeSymbol(rawSymbol) : null;

    const range = buildExecutedAtRange(year);

    if (year && !range) {
      return NextResponse.json(
        {
          ok: false,
          message: "El parámetro year es inválido.",
          data: null,
        },
        { status: 400 },
      );
    }

    const events = (await prisma.taxEvent.findMany({
      where: {
        userId: auth.user.id,
        ...(symbol ? { symbol } : {}),
        ...(range ? { executedAt: range } : {}),
      },
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
    })) as TaxEventRow[];

    const context = evaluateInformativeContext(events);
    const rows: string[] = [];

    rows.push(
      ["Tipo de documento", "Borrador informativo"].map(escapeCsv).join(","),
    );

    rows.push(
      [
        "Advertencia",
        "Este archivo puede usarse para consulta o revisión con especialista, pero no constituye cierre tributario definitivo.",
      ]
        .map(escapeCsv)
        .join(","),
    );

    rows.push(
      ["Pendientes detectados", context.pendingCount].map(escapeCsv).join(","),
    );

    rows.push(
      ["Señales de riesgo detectadas", context.riskCount]
        .map(escapeCsv)
        .join(","),
    );

    rows.push("");

    rows.push(
      [
        "Fecha operación",
        "Tipo evento",
        "Activo",
        "Cantidad",
        "Clasificación tributaria",
        "Costo unitario USD",
        "Ingreso bruto USD",
        "Ingreso neto USD",
        "Costo tributario USD",
        "Fee USD",
        "Resultado USD",
        "Tipo cambio",
        "Ingreso bruto CLP",
        "Ingreso neto CLP",
        "Costo tributario CLP",
        "Fee CLP",
        "Resultado CLP",
        "ID evento",
        "ID movimiento",
      ].join(","),
    );

    for (const event of events) {
      rows.push(
        [
          event.executedAt.toISOString(),
          event.eventType,
          event.symbol,
          round(event.quantity),
          translateCategory(event.effectiveTaxCategory),
          round(event.averageCostUsdAtSale, 8),
          round(event.proceedsGrossUsd, 8),
          round(event.proceedsNetUsd, 8),
          round(event.costBasisUsd, 8),
          round(event.feeUsd, 8),
          round(event.realizedPnlUsd, 8),
          round(event.usdClp, 4),
          round(event.proceedsGrossClp, 4),
          round(event.proceedsNetClp, 4),
          round(event.costBasisClp, 4),
          round(event.feeClp, 4),
          round(event.realizedPnlClp, 4),
          event.id,
          event.movementId,
        ]
          .map(escapeCsv)
          .join(","),
      );
    }

    const csv = "\uFEFF" + rows.join("\n");
    const filename = buildFilename(year, symbol);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("tax informative export error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible generar el borrador de revisión.",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}