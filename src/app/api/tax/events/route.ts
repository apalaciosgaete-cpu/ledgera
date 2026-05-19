import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { round, normalizeSymbol } from "@/shared/utils/math";

import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";

type TaxHealthStatus = "OK" | "REVIEW" | "RISK";

type NormalizedTaxType =
  | "CAPITAL"
  | "ORDINARY"
  | "NON_TAXABLE"
  | "PENDING";

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
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

function normalizeTaxCategory(
  value: string,
): string {
  return value.trim().toUpperCase();
}

function safeIsoDate(
  value:
    | Date
    | string
    | null
    | undefined,
): string | null {
  if (!value) return null;

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date.toISOString();
}

function buildExecutedAtRange(
  year?: string | null,
) {
  if (!year) return null;

  const parsedYear = Number(year);

  if (
    !Number.isInteger(parsedYear) ||
    parsedYear < 2000 ||
    parsedYear > 2100
  ) {
    return null;
  }

  return {
    gte: new Date(
      `${parsedYear}-01-01T00:00:00.000Z`,
    ),

    lt: new Date(
      `${parsedYear + 1}-01-01T00:00:00.000Z`,
    ),
  };
}

function mapEffectiveCategoryToNormalizedTaxType(
  category: string,
): NormalizedTaxType {
  switch (
    normalizeTaxCategory(category)
  ) {
    case "CAPITAL_GAIN":
      return "CAPITAL";

    case "ORDINARY_INCOME":
      return "ORDINARY";

    case "NON_TAXABLE":
      return "NON_TAXABLE";

    default:
      return "PENDING";
  }
}

function getTaxTypeLabel(
  normalizedTaxType: NormalizedTaxType,
): string {
  switch (normalizedTaxType) {
    case "CAPITAL":
      return "Mayor valor";

    case "ORDINARY":
      return "Renta ordinaria";

    case "NON_TAXABLE":
      return "No afecto";

    default:
      return "Pendiente de revisión";
  }
}

function buildTaxTotals(
  events: TaxEventRow[],
) {
  let totalQuantity = 0;

  let totalPnlUsd = 0;
  let totalPnlClp = 0;

  let totalProceedsGrossUsd = 0;
  let totalProceedsNetUsd = 0;

  let totalCostBasisUsd = 0;

  let totalFeeUsd = 0;

  for (const event of events) {
    totalQuantity += event.quantity;

    totalPnlUsd +=
      event.realizedPnlUsd;

    totalPnlClp +=
      event.realizedPnlClp;

    totalProceedsGrossUsd +=
      event.proceedsGrossUsd;

    totalProceedsNetUsd +=
      event.proceedsNetUsd;

    totalCostBasisUsd +=
      event.costBasisUsd;

    totalFeeUsd += event.feeUsd;
  }

  return {
    totalEvents: events.length,

    totalQuantity: round(
      totalQuantity,
      8,
    ),

    totalPnlUsd: round(
      totalPnlUsd,
      8,
    ),

    totalPnlClp: round(
      totalPnlClp,
      4,
    ),

    totalProceedsGrossUsd:
      round(
        totalProceedsGrossUsd,
        8,
      ),

    totalProceedsNetUsd:
      round(
        totalProceedsNetUsd,
        8,
      ),

    totalCostBasisUsd:
      round(
        totalCostBasisUsd,
        8,
      ),

    totalFeeUsd: round(
      totalFeeUsd,
      8,
    ),
  };
}

function buildTaxSummary(
  events: TaxEventRow[],
) {
  const buckets = new Map<
    NormalizedTaxType,
    {
      normalizedTaxType: NormalizedTaxType;
      label: string;
      count: number;
      totalPnlUsd: number;
      totalPnlClp: number;
    }
  >();

  for (const event of events) {
    const normalizedTaxType =
      mapEffectiveCategoryToNormalizedTaxType(
        event.effectiveTaxCategory,
      );

    if (
      !buckets.has(
        normalizedTaxType,
      )
    ) {
      buckets.set(
        normalizedTaxType,
        {
          normalizedTaxType,

          label:
            getTaxTypeLabel(
              normalizedTaxType,
            ),

          count: 0,
          totalPnlUsd: 0,
          totalPnlClp: 0,
        },
      );
    }

    const bucket =
      buckets.get(
        normalizedTaxType,
      )!;

    bucket.count += 1;

    bucket.totalPnlUsd +=
      event.realizedPnlUsd;

    bucket.totalPnlClp +=
      event.realizedPnlClp;
  }

  return {
    totalEvents: events.length,

    categories: Array.from(
      buckets.values(),
    ),
  };
}

function buildTaxHealth(
  events: TaxEventRow[],
) {
  const issues: Array<{
    type: string;
    count: number;
    message: string;
  }> = [];

  const pendingEvents =
    events.filter(
      (event) =>
        mapEffectiveCategoryToNormalizedTaxType(
          event.effectiveTaxCategory,
        ) === "PENDING",
    );

  if (
    pendingEvents.length > 0
  ) {
    issues.push({
      type: "UNCLASSIFIED_EVENTS",

      count:
        pendingEvents.length,

      message:
        "Existen eventos tributarios pendientes.",
    });
  }

  let score = 100;

  score -=
    pendingEvents.length * 25;

  score = Math.max(
    0,
    Math.min(100, score),
  );

  let status: TaxHealthStatus =
    "OK";

  if (
    pendingEvents.length > 0 ||
    score < 50
  ) {
    status = "RISK";
  } else if (score < 80) {
    status = "REVIEW";
  }

  return {
    status,
    score,
    issues,
  };
}

function serializeEvent(
  event: TaxEventRow,
) {
  return {
    id: event.id,

    movementId:
      event.movementId,

    eventType:
      event.eventType,

    symbol: event.symbol,

    executedAt:
      safeIsoDate(
        event.executedAt,
      ),

    quantity:
      event.quantity,

    effectiveTaxCategory:
      event.effectiveTaxCategory,

    averageCostUsdAtSale:
      event.averageCostUsdAtSale,

    proceedsGrossUsd:
      event.proceedsGrossUsd,

    proceedsNetUsd:
      event.proceedsNetUsd,

    costBasisUsd:
      event.costBasisUsd,

    feeUsd: event.feeUsd,

    realizedPnlUsd:
      event.realizedPnlUsd,

    usdClp: event.usdClp,

    proceedsGrossClp:
      event.proceedsGrossClp,

    proceedsNetClp:
      event.proceedsNetClp,

    costBasisClp:
      event.costBasisClp,

    feeClp:
      event.feeClp,

    realizedPnlClp:
      event.realizedPnlClp,

    createdAt:
      safeIsoDate(
        event.createdAt,
      ),

    updatedAt:
      safeIsoDate(
        event.updatedAt,
      ),
  };
}

export async function GET(
  req: NextRequest,
) {
  const auth =
    await requireAuth(req);

  if (
    !auth ||
    auth instanceof
      NextResponse
  ) {
    return fail(
      "No autorizado.",
      401,
    );
  }

  try {
    const { searchParams } =
      new URL(req.url);

    const year =
      searchParams.get(
        "year",
      );

    const rawSymbol =
      searchParams.get(
        "symbol",
      );

    const symbol =
      rawSymbol
        ? normalizeSymbol(
            rawSymbol,
          )
        : null;

    const range =
      buildExecutedAtRange(
        year,
      );

    if (year && !range) {
      return fail(
        "El parámetro year es inválido.",
        400,
      );
    }

    const events =
      (await prisma.taxEvent.findMany(
        {
          where: {
  ...buildUserScopeWhere(auth.user),
  ...(symbol ? { symbol } : {}),
  ...(range ? { executedAt: range } : {}),
},

          orderBy: [
            {
              executedAt:
                "asc",
            },

            {
              id: "asc",
            },
          ],
        },
      )) as TaxEventRow[];

    return ok(
      {
        events:
          events.map(
            serializeEvent,
          ),

        totals:
          buildTaxTotals(
            events,
          ),

        taxSummary:
          buildTaxSummary(
            events,
          ),

        taxHealth:
          buildTaxHealth(
            events,
          ),

        filters: {
          year,
          symbol,
        },
      },

      "Eventos tributarios obtenidos correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}