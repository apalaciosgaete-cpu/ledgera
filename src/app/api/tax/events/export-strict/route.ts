import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MovementRow = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  suggestedTaxCategory: string;
  appliedTaxCategory: string | null;
  taxClassificationSource: string;
  executedAt: Date;
};

type InventoryLot = {
  quantity: number;
  unitCostUsd: number;
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

function resolveUsdClpRate(): number {
  return Number(process.env.USD_TO_CLP_RATE) || 950;
}

function normalizeType(value: string) {
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

function translateCategory(cat: string | null) {
  switch (cat) {
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
  switch (src) {
    case "USER":
      return "Usuario";
    case "ACCOUNTANT":
      return "Contador";
    default:
      return "Sistema";
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

  return `ledgera-resumen-contador-${safeYear}-${safeSymbol}.csv`;
}

function resolveEffectiveCategory(movement: MovementRow) {
  return (
    movement.appliedTaxCategory ||
    movement.suggestedTaxCategory ||
    "UNCLASSIFIED"
  ).trim().toUpperCase();
}

function evaluateStrictExportEligibility(movements: MovementRow[]) {
  const sellMovements = movements.filter(
    (movement) => normalizeType(movement.type) === "SELL",
  );

  const pendingMovements = sellMovements.filter((movement) => {
    const category = resolveEffectiveCategory(movement);
    return !FINAL_TAX_CATEGORIES.has(category);
  });

  const riskMovements = sellMovements.filter((movement) => {
    const category = resolveEffectiveCategory(movement);
    const source = (movement.taxClassificationSource || "SYSTEM")
      .trim()
      .toUpperCase();

    return category === "ORDINARY_INCOME" && source === "SYSTEM";
  });

  return {
    isBlocked: pendingMovements.length > 0 || riskMovements.length > 0,
    pendingCount: pendingMovements.length,
    riskCount: riskMovements.length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const year = searchParams.get("year");
    const rawSymbol = searchParams.get("symbol");
    const symbol = rawSymbol ? rawSymbol.toUpperCase() : null;

    const range = year ? buildExecutedAtRange(year) : null;

    if (year && !range) {
      return NextResponse.json(
        {
          ok: false,
          message: "El parámetro year es inválido.",
        },
        { status: 400 },
      );
    }

    const movements = (await prisma.portfolioMovement.findMany({
      where: {
        ...(symbol ? { symbol } : {}),
        ...(range ? { executedAt: range } : {}),
      },
      orderBy: [{ executedAt: "asc" }],
    })) as MovementRow[];

    const eligibility = evaluateStrictExportEligibility(movements);

    if (eligibility.isBlocked) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El resumen para contador está bloqueado porque existen pendientes tributarios o señales de riesgo.",
          data: {
            pendingCount: eligibility.pendingCount,
            riskCount: eligibility.riskCount,
          },
        },
        { status: 409 },
      );
    }

    const usdClp = resolveUsdClpRate();
    const inventory = new Map<string, InventoryLot[]>();
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
        "Resultado USD",
        "Tipo cambio",
        "Resultado CLP",
        "Origen clasificación",
        "ID movimiento",
      ].join(","),
    );

    for (const movement of movements) {
      const type = normalizeType(movement.type);
      const sym = normalizeSymbol(movement.symbol);

      if (!inventory.has(sym)) {
        inventory.set(sym, []);
      }

      const lots = inventory.get(sym)!;

      if (type === "BUY") {
        const totalCostUsd =
          movement.quantity * movement.priceUsd + movement.feeUsd;

        lots.push({
          quantity: movement.quantity,
          unitCostUsd:
            movement.quantity > 0 ? totalCostUsd / movement.quantity : 0,
        });

        continue;
      }

      if (type !== "SELL") {
        continue;
      }

      let remaining = movement.quantity;
      let costBasisUsd = 0;

      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const used = Math.min(lot.quantity, remaining);

        costBasisUsd += used * lot.unitCostUsd;
        lot.quantity -= used;
        remaining -= used;

        if (lot.quantity <= 0) {
          lots.shift();
        }
      }

      const proceedsNetUsd = movement.quantity * movement.priceUsd - movement.feeUsd;
      const pnlUsd = proceedsNetUsd - costBasisUsd;
      const pnlClp = Math.round(pnlUsd * usdClp);

      rows.push(
        [
          movement.executedAt.toISOString(),
          type,
          sym,
          round(movement.quantity),
          translateCategory(resolveEffectiveCategory(movement)),
          round(proceedsNetUsd, 2),
          round(costBasisUsd, 2),
          round(pnlUsd, 2),
          usdClp,
          pnlClp,
          translateSource(movement.taxClassificationSource),
          movement.id,
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
    console.error("tax strict export error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible generar el resumen para contador.",
      },
      { status: 500 },
    );
  }
}