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

type ConfirmBody = {
  action:   "CONFIRM" | "REJECT" | "REVIEW";
  recordId: string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as ConfirmBody;
    const { action, recordId } = body;

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

    // ── REVIEW: marcar para revisión manual ───────────────────────────────
    if (action === "REVIEW") {
      await markImportAsReview(recordId, auth.user.id);
      return ok({ recordId, status: "REVIEW" }, "Registro marcado para revisión manual.");
    }

    // ── REJECT ────────────────────────────────────────────────────────────
    if (action === "REJECT") {
      await rejectImport(recordId, auth.user.id);
      await logBinanceAuditEvent(request, "BINANCE_IMPORT_REJECTED", auth.user.id, auth.user.email, {
        provider:       "BINANCE",
        status:         "SUCCESS",
        importRecordId: recordId,
        externalId:     record.externalId,
        externalType:   record.externalType,
      });
      return ok({ recordId, status: "REJECTED" }, "Registro rechazado.");
    }

    // ── CONFIRM ───────────────────────────────────────────────────────────

    // Gate tributario: eventos con taxTreatment o inventoryEffect = REVIEW
    // no pueden entrar al motor sin decisión explícita.
    const taxTreatment   = record.taxTreatment   ?? "REVIEW";
    const inventoryEffect = record.inventoryEffect ?? "REVIEW";

    if (taxTreatment === "REVIEW" || inventoryEffect === "REVIEW") {
      return fail(
        `El evento "${record.normalizedEventType ?? record.externalType}" requiere revisión manual antes de confirmar. ` +
        `Usa "Marcar para revisión" para diferirlo o "Rechazar" para descartarlo.`,
        422,
      );
    }

    const normalized = JSON.parse(record.normalizedJson ?? "{}") as NormalizedImportRecord;

    // DEPOSIT/WITHDRAW: trazabilidad patrimonial, priceUsd=0 (no evento tributario)
    if (normalized.movementType === "DEPOSIT" || normalized.movementType === "WITHDRAW") {
      const transferMovement = await prisma.portfolioMovement.create({
        data: {
          userId:     auth.user.id,
          type:       normalized.movementType,
          symbol:     normalized.symbol,
          quantity:   normalized.quantity,
          priceUsd:   0,
          feeUsd:     normalized.feeUsd,
          executedAt: normalized.occurredAt,
          source:     "BINANCE",
          externalId: normalized.externalId,
        },
      });
      await confirmImport(recordId, auth.user.id, transferMovement.id);
      await logBinanceAuditEvent(request, "BINANCE_IMPORT_CONFIRMED", auth.user.id, auth.user.email, {
        provider:       "BINANCE",
        status:         "SUCCESS",
        importRecordId: recordId,
        externalId:     record.externalId,
        externalType:   record.externalType,
      });
      return ok({ recordId, status: "CONFIRMED", movementId: transferMovement.id }, "Registro confirmado (trazabilidad patrimonial).");
    }

    // BUY/SELL: verificar período abierto
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
        source:     "BINANCE",
        externalId: normalized.externalId,
      },
    });

    await confirmImport(recordId, auth.user.id, movement.id);

    const rebuild = await rebuildTaxEvents(auth.user.id);
    if (!rebuild.ok) {
      return fail("Movimiento creado, pero falló la reconstrucción de eventos tributarios.", 500);
    }

    await logBinanceAuditEvent(request, "BINANCE_IMPORT_CONFIRMED", auth.user.id, auth.user.email, {
      provider:       "BINANCE",
      status:         "SUCCESS",
      importRecordId: recordId,
      externalId:     record.externalId,
      externalType:   record.externalType,
      connectionId:   record.connectionId,
    });

    return ok(
      { recordId, status: "CONFIRMED", movementId: movement.id, taxEventsRebuilt: true },
      "Movimiento creado y eventos tributarios reconstruidos.",
      201,
    );
  } catch (error) {
    return serverError(error);
  }
}
