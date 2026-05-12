import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TaxCategory =
  | "NON_TAXABLE"
  | "CAPITAL_GAIN"
  | "ORDINARY_INCOME"
  | "UNCLASSIFIED";

function suggestTaxCategory(type: string): TaxCategory {
  const normalized = String(type).trim().toUpperCase();

  if (normalized === "SELL") {
    return "CAPITAL_GAIN";
  }

  if (normalized === "BUY") {
    return "UNCLASSIFIED";
  }

  return "UNCLASSIFIED";
}

export async function POST() {
  try {
    const movements = await prisma.portfolioMovement.findMany({
      orderBy: {
        executedAt: "asc",
      },
    });

    let updatedCount = 0;

    for (const movement of movements) {
      const nextSuggestedTaxCategory = suggestTaxCategory(movement.type);

      const needsSuggestedUpdate =
        String(movement.suggestedTaxCategory ?? "") !== nextSuggestedTaxCategory;

      const needsSourceUpdate =
        String(movement.taxClassificationSource ?? "") !== "SYSTEM";

      if (!needsSuggestedUpdate && !needsSourceUpdate) {
        continue;
      }

      await prisma.portfolioMovement.update({
        where: {
          id: movement.id,
        },
        data: {
          suggestedTaxCategory: nextSuggestedTaxCategory,
          taxClassificationSource: "SYSTEM",
        },
      });

      updatedCount += 1;
    }

    return NextResponse.json({
      ok: true,
      message: "Backfill tributario ejecutado correctamente",
      data: {
        totalMovements: movements.length,
        updatedCount,
      },
    });
  } catch (error) {
    const err = error as Error;

    return NextResponse.json(
      {
        ok: false,
        message: "Error al ejecutar backfill tributario",
        debug: {
          message: err.message,
        },
      },
      { status: 500 }
    );
  }
}