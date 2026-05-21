import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import {
  findConnectionByUser,
  setSyncFailed,
  setSyncFinished,
  setSyncRunning,
} from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/integrations/binance/application/encryptCredentials";
import { syncBinance } from "@/modules/integrations/binance/application/syncBinance";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";
import { autoConfirmImports } from "@/modules/integrations/binance/application/autoConfirmImports";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { generateAnnualTaxSummary } from "@/modules/tax/application/generateAnnualTaxSummary";

function getStaleSyncMinutes(): number {
  const val = Number(process.env.BINANCE_STALE_SYNC_MINUTES ?? "30");
  return Number.isFinite(val) && val > 0 ? val : 30;
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const conn = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!conn) return fail("No hay conexión con Binance configurada.", 404);
    if (conn.status === "REVOKED") return fail("La conexión ha sido revocada.", 403);

    // ── Bloqueo doble sync ─────────────────────────────────────────────
    if (conn.syncStatus === "RUNNING") {
      const staleMs   = getStaleSyncMinutes() * 60 * 1000;
      const startedAt = conn.syncStartedAt?.getTime() ?? 0;

      if (Date.now() - startedAt < staleMs) {
        return fail(
          "Ya hay una sincronización en curso. Espera a que finalice o intenta en unos minutos.",
          409,
        );
      }
      // Sync abandonada (stale) — se permite recovery
    }

    // ── Marcar RUNNING ─────────────────────────────────────────────────
    await setSyncRunning(conn.id);

    await logBinanceAuditEvent(request, "BINANCE_SYNC_STARTED", auth.user.id, auth.user.email, {
      provider:     "BINANCE",
      status:       "SUCCESS",
      connectionId: conn.id,
    });

    const apiKey    = decryptSecret(conn.apiKey);
    const apiSecret = decryptSecret(conn.apiSecret);

    let output: Awaited<ReturnType<typeof syncBinance>>;

    try {
      output = await syncBinance(
        auth.user.id,
        conn.id,
        apiKey,
        apiSecret,
        conn.syncCheckpoint,
      );
    } catch (e) {
      // Error inesperado en el sync — marcar FAILED sin actualizar checkpoint
      await setSyncFailed(conn.id, e instanceof Error ? e.message : "Error desconocido");

      await logBinanceAuditEvent(request, "BINANCE_SYNC_FAILED", auth.user.id, auth.user.email, {
        provider:     "BINANCE",
        status:       "FAILED",
        connectionId: conn.id,
        error:        e instanceof Error ? e.message : "Error desconocido",
      });

      throw e;
    }

    const { result, checkpoint } = output;
    const hasFailed = result.errors.length > 0;

    // ── Persiste checkpoint y estado final ────────────────────────────
    if (hasFailed) {
      await setSyncFailed(
        conn.id,
        result.errors.slice(0, 3).join(" | "),
        checkpoint,
      );
    } else {
      await setSyncFinished(conn.id, checkpoint);
    }

    // ── Auditoría con metadata enriquecida ────────────────────────────
    const partialStats = {
      imported: result.imported,
      skipped:  result.skipped,
      errors:   result.errors.length,
    };

    await logBinanceAuditEvent(
      request,
      hasFailed ? "BINANCE_SYNC_FAILED" : "BINANCE_SYNC_COMPLETED",
      auth.user.id,
      auth.user.email,
      {
        provider:     "BINANCE",
        status:       hasFailed ? "FAILED" : "SUCCESS",
        connectionId: conn.id,
        stats:        partialStats,
        ...(hasFailed && result.firstFailure
          ? {
              failedSymbol:     result.firstFailure.symbol,
              failedWindowStart: result.firstFailure.windowStart,
              failedWindowEnd:   result.firstFailure.windowEnd,
              partialStats,
            }
          : {}),
        ...(hasFailed ? { error: result.errors.slice(0, 3).join(" | ") } : {}),
      },
    );

    // ── Auto-confirmación de eventos seguros ──────────────────────────
    let autoConfirm = { confirmed: 0, skippedReview: 0, errors: [] as string[] };
    let taxRebuilt  = false;

    if (result.imported > 0 || result.skipped > 0) {
      try {
        autoConfirm = await autoConfirmImports(auth.user.id);

        if (autoConfirm.confirmed > 0) {
          const rebuild = await rebuildTaxEvents(auth.user.id);
          taxRebuilt = rebuild.ok;
          if (taxRebuilt) {
            await generateAnnualTaxSummary(auth.user.id);
          }
        }
      } catch (autoErr) {
        console.error("[sync] auto-confirm error:", autoErr);
        autoConfirm.errors.push(
          autoErr instanceof Error ? autoErr.message : "Error en auto-confirmación",
        );
      }
    }

    const allErrors  = [...result.errors, ...autoConfirm.errors];
    const hasErrors  = allErrors.length > 0;

    const message = hasErrors
      ? `Sincronización parcial: ${result.imported} descargados, ${autoConfirm.confirmed} confirmados, ${allErrors.length} errores.`
      : `Sincronización completa: ${result.imported} descargados, ${autoConfirm.confirmed} confirmados automáticamente${autoConfirm.skippedReview > 0 ? `, ${autoConfirm.skippedReview} en revisión manual` : ""}.`;

    return ok(
      {
        imported:      result.imported,
        skipped:       result.skipped,
        autoConfirmed: autoConfirm.confirmed,
        pendingReview: autoConfirm.skippedReview,
        errors:        allErrors,
        symbolStats:   result.symbolStats,
        taxRebuilt,
      },
      message,
    );
  } catch (error) {
    return serverError(error);
  }
}
