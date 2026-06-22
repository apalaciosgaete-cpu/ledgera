import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { findConnectionByUser } from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";

type MovementTypeMap = {
  normalizedEventType: string;
  taxTreatment: string;
  inventoryEffect: string;
  economicEffect: string;
  externalType: string;
};

function mapMovementType(type: string): MovementTypeMap {
  if (type === "BUY") {
    return {
      normalizedEventType: "SPOT_BUY",
      taxTreatment: "ACQUISITION",
      inventoryEffect: "ADD",
      economicEffect: "ACQUISITION",
      externalType: "TRADE",
    };
  }

  if (type === "SELL") {
    return {
      normalizedEventType: "SPOT_SELL",
      taxTreatment: "DISPOSAL",
      inventoryEffect: "REMOVE",
      economicEffect: "DISPOSAL",
      externalType: "TRADE",
    };
  }

  if (type === "DEPOSIT") {
    return {
      normalizedEventType: "EXTERNAL_DEPOSIT",
      taxTreatment: "NEUTRAL",
      inventoryEffect: "NEUTRAL",
      economicEffect: "NEUTRAL",
      externalType: "DEPOSIT",
    };
  }

  if (type === "WITHDRAW") {
    return {
      normalizedEventType: "EXTERNAL_WITHDRAW",
      taxTreatment: "NEUTRAL",
      inventoryEffect: "NEUTRAL",
      economicEffect: "NEUTRAL",
      externalType: "WITHDRAW",
    };
  }

  return {
    normalizedEventType: "UNKNOWN",
    taxTreatment: "REVIEW",
    inventoryEffect: "REVIEW",
    economicEffect: "REVIEW",
    externalType: "UNKNOWN",
  };
}

function buildExternalId(movement: {
  id: string;
  externalId: string | null;
  source: string;
}) {
  return movement.externalId?.trim() || `BACKFILL-${movement.source}-${movement.id}`;
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const binance = await findConnectionByUser(auth.user.id, "BINANCE");
    const binanceTax = await findConnectionByUser(auth.user.id, "BINANCE_TAX");

    if (!binance && !binanceTax) {
      return fail("No hay conexiones Binance para asociar el backfill.", 404);
    }

    const movements = await prisma.portfolioMovement.findMany({
      where: {
        userId: auth.user.id,
        source: { in: ["BINANCE", "BINANCE_TAX"] },
        deletedAt: null,
        importRecord: null,
      },
      orderBy: {
        executedAt: "asc",
      },
      take: 1000,
    });

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const movement of movements) {
      try {
        const provider = movement.source;
        const connection =
          provider === "BINANCE_TAX"
            ? binanceTax ?? binance
            : binance ?? binanceTax;

        if (!connection) {
          skipped++;
          continue;
        }

        const mapped = mapMovementType(movement.type);
        const externalId = buildExternalId(movement);

        const normalized = {
          externalId,
          externalType: mapped.externalType,
          movementType: movement.type,
          symbol: movement.symbol,
          quantity: movement.quantity,
          priceUsd: movement.priceUsd,
          feeUsd: movement.feeUsd,
          occurredAt: movement.executedAt,
          normalizedEventType: mapped.normalizedEventType,
          taxTreatment: mapped.taxTreatment,
          inventoryEffect: mapped.inventoryEffect,
          economicEffect: mapped.economicEffect,
        };

        await prisma.exchangeImportRecord.create({
          data: {
            userId: auth.user.id,
            connectionId: connection.id,
            provider,
            externalId,
            externalType: mapped.externalType,
            rawPayload: JSON.stringify({
              source: "PORTFOLIO_MOVEMENT_BACKFILL",
              movementId: movement.id,
            }),
            normalizedJson: JSON.stringify(normalized),
            normalizedEventType: mapped.normalizedEventType,
            taxTreatment: mapped.taxTreatment,
            inventoryEffect: mapped.inventoryEffect,
            economicEffect: mapped.economicEffect,
            status: "CONFIRMED",
            movementId: movement.id,
            occurredAt: movement.executedAt,
          },
        });

        created++;
      } catch (error) {
        skipped++;
        errors.push(
          `${movement.id}: ${error instanceof Error ? error.message : "error desconocido"}`,
        );
      }
    }

    return ok(
      {
        scanned: movements.length,
        created,
        skipped,
        errors,
      },
      `Backfill Binance completado: ${created} registros creados, ${skipped} omitidos.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
