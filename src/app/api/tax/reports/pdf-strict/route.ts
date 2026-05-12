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
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  usdClp: number;
  realizedPnlClp: number;
  movement: {
    taxClassificationSource: string;
  } | null;
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

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function buildExecutedAtRange(year: string) {
  const y = Number(year);

  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    return null;
  }

  return {
    gte: new Date(`${y}-01-01T00:00:00.000Z`),
    lt: new Date(`${y + 1}-01-01T00:00:00.000Z`),
  };
}

function translateCategory(cat: string) {
  switch (normalizeCategory(cat)) {
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

function translateSource(src: string | null) {
  switch ((src ?? "SYSTEM").trim().toUpperCase()) {
    case "USER":
      return "Usuario";
    case "ACCOUNTANT":
      return "Contador";
    default:
      return "Sistema";
  }
}

function escapeCsv(value: unknown) {
  const str = String(value ?? "");

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
  const safeYear = year?.trim() ?? "all";
  const safeSymbol = symbol?.trim().toUpperCase() ?? "all";

  return `ledgera-resumen-contador-${safeYear}-${safeSymbol}.csv`;
}

function evaluateEligibility(events: TaxEventRow[]) {
  const pendingEvents = events.filter(
    (e) => !FINAL_TAX_CATEGORIES.has(normalizeCategory(e.effectiveTaxCategory)),
  );

  const riskEvents = events.filter((e) => {
    const cat = normalizeCategory(e.effectiveTaxCategory);

    const src = (e.movement?.taxClassificationSource ?? "SYSTEM")
      .trim()
      .toUpperCase();

    return cat === "ORDINARY_INCOME" && src === "SYSTEM";
  });

  return {
    isBlocked: pendingEvents.length > 0 || riskEvents.length > 0,
    pendingCount: pendingEvents.length,
    riskCount: riskEvents.length,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth || auth instanceof NextResponse) {
    return NextResponse.json(
      { ok: false, message: "No autorizado." },
      { status: 401 },
    );
  }

  const currentUser = await getUserById(auth.user.id);

  if (!currentUser) {
    return NextResponse.json(
      { ok: false, message: "Usuario no encontrado." },
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

    const range = year ? buildExecutedAtRange(year) : null;

    if (year && !range) {
      return NextResponse.json(
        { ok: false, message: "El parámetro year es inválido." },
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
      include: {
        movement: {
          select: { taxClassificationSource: true },
        },
      },
    })) as TaxEventRow[];

    const eligibility = evaluateEligibility(events);

    if (eligibility.isBlocked) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El reporte para contador está bloqueado: existen eventos pendientes de clasificación o señales de riesgo.",
          data: {
            pendingCount: eligibility.pendingCount,
            riskCount: eligibility.riskCount,
          },
        },
        { status: 409 },
      );
    }

    const rows: string[] = [];

    rows.push(
      [
        "Fecha operación",
        "Tipo evento",
        "Activo",
        "Cantidad",
        "Clasificación tributaria",
        "Ingreso neto USD",
        "Costo tributario USD",
        "Fee USD",
        "Resultado USD",
        "Tipo cambio USD/CLP",
        "Resultado CLP",
        "Origen clasificación",
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
          round(event.quantity, 8),
          translateCategory(event.effectiveTaxCategory),
          round(event.proceedsNetUsd, 2),
          round(event.costBasisUsd, 2),
          round(event.feeUsd, 2),
          round(event.realizedPnlUsd, 2),
          round(event.usdClp, 4),
          round(event.realizedPnlClp, 2),
          translateSource(event.movement?.taxClassificationSource ?? null),
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
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("export-strict error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible generar el reporte para contador.",
      },
      { status: 500 },
    );
  }
}