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
import { syncBinanceMonth } from "@/modules/integrations/binance/application/syncBinanceMonth";
import {
  ensurePeriodsExist,
  getNextPendingPeriods,
  setPeriodCompleted,
  setPeriodEmpty,
  setPeriodFailed,
  setPeriodRunning,
} from "@/modules/integrations/binance/infrastructure/exchangeSyncPeriodRepository";
import { logBinanceAuditEvent } from "@/modules/integrations/binance/application/logBinanceAuditEvent";
import { autoConfirmImports } from "@/modules/integrations/binance/application/autoConfirmImports";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { generateAnnualTaxSummary } from "@/modules/tax/application/generateAnnualTaxSummary";

const MONTH_ES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getStaleSyncMinutes(): number {
  const val = Number(process.env.BINANCE_STALE_SYNC_MINUTES ?? "30");
  return Number.isFinite(val) && val > 0 ? val : 30;
}

function getStartDate(): Date {
  const raw = process.env.BINANCE_SYNC_START_DATE ?? "2024-01-01";
  const d   = new Date(raw);
  return isNaN(d.getTime()) ? new Date("2024-01-01") : d;
}

function getMonthsPerRun(): number {
  const val = Number(process.env.BINANCE_SYNC_MONTHS_PER_RUN ?? "1");
  return Number.isFinite(val) && val > 0 ? val : 1;
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
          "Ya hay una sincronización en curso. Espera a que finalice o usa 'Reiniciar sync' si lleva más de 5 minutos.",
          409,
        );
      }
    }

    const apiKey    = decryptSecret(conn.apiKey);
    const apiSecret = decryptSecret(conn.apiSecret);

    // ── Inicializar períodos mensuales desde fecha de inicio hasta hoy ──
    const startDate    = getStartDate();
    const today        = new Date();
    await ensurePeriodsExist(auth.user.id, conn.id, "BINANCE", startDate, today);

    // ── Obtener próximos períodos pendientes o fallidos ─────────────────
    const monthsPerRun = getMonthsPerRun();
    const periods      = await getNextPendingPeriods(auth.user.id, "BINANCE", monthsPerRun);

    if (periods.length === 0) {
      if (conn.syncStatus === "RUNNING") {
        await setSyncFinished(conn.id, {});
      }
      return ok(
        { imported: 0, skipped: 0, autoConfirmed: 0, pendingReview: 0, errors: [], taxRebuilt: false, allPeriodsSynced: true },
        "Todo el historial está sincronizado. No hay períodos pendientes.",
      );
    }

    // ── Marcar conexión RUNNING ────────────────────────────────────────
    await setSyncRunning(conn.id);

    const periodLabels = periods.map(p => `${MONTH_ES[p.month]} ${p.year}`);

    await logBinanceAuditEvent(request, "BINANCE_SYNC_STARTED", auth.user.id, auth.user.email, {
      provider:     "BINANCE",
      status:       "SUCCESS",
      connectionId: conn.id,
      periods:      periodLabels,
    });

    let totalImported = 0;
    let totalSkipped  = 0;
    const allErrors: string[] = [];
    const periodResults: Array<{ year: number; month: number; imported: number; status: string }> = [];

    // ── Sincronizar cada período ───────────────────────────────────────
    for (const period of periods) {
      await setPeriodRunning(period.id);

      try {
        const result = await syncBinanceMonth(
          auth.user.id,
          conn.id,
          apiKey,
          apiSecret,
          period.year,
          period.month,
        );

        const periodTotal = result.imported + result.skipped;

        if (result.errors.length > 0) {
          await setPeriodFailed(period.id, result.errors.slice(0, 3).join(" | "), periodTotal);
          allErrors.push(...result.errors.map(e => `${MONTH_ES[period.month]} ${period.year}: ${e}`));
          periodResults.push({ year: period.year, month: period.month, imported: periodTotal, status: "FAILED" });
        } else if (periodTotal === 0) {
          await setPeriodEmpty(period.id);
          periodResults.push({ year: period.year, month: period.month, imported: 0, status: "EMPTY" });
        } else {
          await setPeriodCompleted(period.id, periodTotal);
          periodResults.push({ year: period.year, month: period.month, imported: periodTotal, status: "COMPLETED" });
        }

        totalImported += result.imported;
        totalSkipped  += result.skipped;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        await setPeriodFailed(period.id, msg, 0);
        allErrors.push(`${MONTH_ES[period.month]} ${period.year}: ${msg}`);
        periodResults.push({ year: period.year, month: period.month, imported: 0, status: "FAILED" });
      }
    }

    // ── Persistir estado conexión ─────────────────────────────────────
    const hasFailed = allErrors.length > 0;
    if (hasFailed) {
      await setSyncFailed(conn.id, allErrors.slice(0, 3).join(" | "));
    } else {
      await setSyncFinished(conn.id, {});
    }

    // ── Auditoría ─────────────────────────────────────────────────────
    await logBinanceAuditEvent(
      request,
      hasFailed ? "BINANCE_SYNC_FAILED" : "BINANCE_SYNC_COMPLETED",
      auth.user.id,
      auth.user.email,
      {
        provider:      "BINANCE",
        status:        hasFailed ? "FAILED" : "SUCCESS",
        connectionId:  conn.id,
        imported:      totalImported,
        skipped:       totalSkipped,
        errors:        allErrors.length,
        periodResults,
      },
    );

    // ── Auto-confirmación de eventos seguros ──────────────────────────
    // Corre siempre: puede haber PENDING de ciclos anteriores sin procesar.
    let autoConfirm = { confirmed: 0, skippedReview: 0, errors: [] as string[] };
    let taxRebuilt  = false;

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

    const combinedErrors = [...allErrors, ...autoConfirm.errors];
    const hasErrors      = combinedErrors.length > 0;
    const periodLabel    = periodLabels.join(", ");

    const message = hasErrors
      ? `Sincronización parcial (${periodLabel}): ${totalImported} descargados, ${autoConfirm.confirmed} confirmados, ${combinedErrors.length} errores.`
      : `Sincronización completa (${periodLabel}): ${totalImported} descargados, ${autoConfirm.confirmed} confirmados automáticamente${autoConfirm.skippedReview > 0 ? `, ${autoConfirm.skippedReview} en revisión manual` : ""}.`;

    return ok(
      {
        imported:        totalImported,
        skipped:         totalSkipped,
        autoConfirmed:   autoConfirm.confirmed,
        pendingReview:   autoConfirm.skippedReview,
        errors:          combinedErrors,
        taxRebuilt,
        periodResults,
        allPeriodsSynced: false,
      },
      message,
    );
  } catch (error) {
    return serverError(error);
  }
}
