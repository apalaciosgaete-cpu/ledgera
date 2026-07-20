// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import {
  confirmImport,
  markImportAsReview,
  rejectImport,
} from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";
import type { NormalizedImportRecord } from "@/modules/integrations/binance/domain/binanceTypes";
import { fetchHistoricalCryptoPrice } from "@/modules/integrations/binance/application/fetchHistoricalCryptoPrice";
import { enforceMovementLimit } from "@/modules/subscription/application/enforceMovementLimit";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";

type ConfirmBody = {
  action:       "CONFIRM" | "REJECT" | "REVIEW";
  recordId:     string;
  duplicateIds?: string[];
  override?: {
    movementType?: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";
    priceUsd?:     number;
    feeUsd?:       number;
  };
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const subscriptionCheck = requireActiveSubscription(auth.user);
  if (!subscriptionCheck.ok) return subscriptionCheck.response;

  try {
    const body = (await request.json()) as ConfirmBody;
    const { action, recordId, duplicateIds = [], override } = body;

    if (!recordId) return fail("recordId es obligatorio.", 400);
    if (action !== "CONFIRM" && action !== "REJECT" && action !== "REVIEW") {
      return fail("action debe ser CONFIRM, REJECT o REVIEW.", 400);
    }

    const record = await prisma.exchangeImportRecord.findUnique({
      where: { id: recordId },
    });

    if (!record || record.userId !== auth.user.id) {
      return fail("Registro no encontrado.", 404);
    }
    if (record.status === "CONFIRMED" || record.status === "REJECTED") {
      return fail("El registro ya fue procesado.", 409);
    }

    if (action === "REVIEW") {
      await markImportAsReview(recordId, auth.user.id);
      return ok({ recordId, status: "REVIEW" }, "Registro marcado para revisión manual.");
    }

    if (action === "REJECT") {
      await rejectImport(recordId, auth.user.id);
      for (const dupId of duplicateIds) {
        const dup = await prisma.exchangeImportRecord.findFirst({
          where: { id: dupId, userId: auth.user.id, status: { notIn: ["CONFIRMED"] } },
        });
        if (dup) await rejectImport(dupId, auth.user.id);
      }
      await logBinanceAuditEvent(request, "BINANCE_IMPORT_REJECTED", auth.user.id, auth.user.email, {
        provider:       record.provider as "BINANCE" | "BINANCE_TAX",
        status:         "SUCCESS",
        importRecordId: recordId,
        externalId:     record.externalId,
        externalType:   record.externalType,
      });
      return ok({ recordId, status: "REJECTED", rejectedDuplicates: duplicateIds.length }, "Registro rechazado.");
    }

    const taxTreatment    = record.taxTreatment   ?? "REVIEW";
    const inventoryEffect = record.inventoryEffect ?? "REVIEW";
    const needsReview     = taxTreatment === "REVIEW" || inventoryEffect === "REVIEW";

    if (needsReview && (!override?.movementType || override.priceUsd === undefined)) {
      return fail(
        `El evento "${record.normalizedEventType ?? record.externalType}" requiere revisión manual antes de confirmar. ` +
        "Proporciona tipo, precio y fee para confirmarlo con ajustes.",
        422,
      );
    }

    const normalized = JSON.parse(record.normalizedJson ?? "{}") as NormalizedImportRecord;

    if (override?.movementType) normalized.movementType = override.movementType;
    if (override?.priceUsd !== undefined && override.priceUsd >= 0) normalized.priceUsd = override.priceUsd;
    if (override?.feeUsd   !== undefined && override.feeUsd   >= 0) normalized.feeUsd   = override.feeUsd;

    await enforceMovementLimit({ userId: auth.user.id });

    if (normalized.movementType === "DEPOSIT" || normalized.movementType === "WITHDRAW") {
      const historicalPrice = await fetchHistoricalCryptoPrice(
        normalized.symbol,
        new Date(normalized.occurredAt),
      );
      const transferMovement = await prisma.portfolioMovement.create({
        data: {
          userId:     auth.user.id,
          type:       normalized.movementType,
          symbol:     normalized.symbol,
          quantity:   normalized.quantity,
          priceUsd:   historicalPrice,
          feeUsd:     normalized.feeUsd,
          executedAt: normalized.occurredAt,
          source:     record.provider,
          externalId: normalized.externalId,
        },
      });
      await confirmImport(recordId, auth.user.id, transferMovement.id);
      for (const dupId of duplicateIds) {
        await confirmImport(dupId, auth.user.id, transferMovement.id);
      }
      await logBinanceAuditEvent(request, "BINANCE_IMPORT_CONFIRMED", auth.user.id, auth.user.email, {
        provider:       record.provider as "BINANCE" | "BINANCE_TAX",
        status:         "SUCCESS",
        importRecordId: recordId,
        externalId:     record.externalId,
        externalType:   record.externalType,
      });
      return ok({ recordId, status: "CONFIRMED", movementId: transferMovement.id, linkedDuplicates: duplicateIds.length }, "Registro confirmado (trazabilidad patrimonial).");
    }

    try {
      await assertPeriodOpen(normalized.occurredAt, auth.user.id);
    } catch (err) {
      await logBinanceAuditEvent(request, "BINANCE_IMPORT_CONFIRMED", auth.user.id, auth.user.email, {
        provider:       "BINANCE",
        status:         "FAILED",
        importRecordId: recordId,
        externalId:     record.externalId,
        externalType:   record.externalType,
        error:          err instanceof Error ? err.message : "Período cerrado",
      });
      return fail(
        err instanceof Error ? err.message : "El período tributario está cerrado.",
        409,
      );
    }

    const movement = await prisma.portfolioMovement.create({
      data: {
        userId:     auth.user.id,
        type:       normalized.movementType,
        symbol:     normalized.symbol,
        quantity:   normalized.quantity,
        priceUsd:   normalized.priceUsd,
        feeUsd:     normalized.feeUsd,
        executedAt: normalized.occurredAt,
        source:     record.provider,
        externalId: normalized.externalId,
      },
    });

    await confirmImport(recordId, auth.user.id, movement.id);
    for (const dupId of duplicateIds) {
      await confirmImport(dupId, auth.user.id, movement.id);
    }

    const rebuild = await rebuildTaxEvents(auth.user.id);
    if (!rebuild.ok) {
      return fail("Movimiento creado, pero falló la reconstrucción de eventos tributarios.", 500);
    }

    await logBinanceAuditEvent(request, "BINANCE_IMPORT_CONFIRMED", auth.user.id, auth.user.email, {
      provider:       record.provider as "BINANCE" | "BINANCE_TAX",
      status:         "SUCCESS",
      importRecordId: recordId,
      externalId:     record.externalId,
      externalType:   record.externalType,
      connectionId:   record.connectionId,
    });

    return ok(
      { recordId, status: "CONFIRMED", movementId: movement.id, linkedDuplicates: duplicateIds.length, taxEventsRebuilt: true },
      "Movimiento creado y eventos tributarios reconstruidos.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
