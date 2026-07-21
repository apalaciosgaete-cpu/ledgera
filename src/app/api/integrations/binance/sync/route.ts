import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { requireActiveSubscription } from "@/modules/subscription/application/requireActiveSubscription";
import {
  findConnectionByUser,
  setSyncFailed,
  setSyncFinished,
  setSyncRunning,
} from "@/modules/integrations/binance/infrastructure/exchangeConnectionRepository";
import { decryptSecret } from "@/modules/security/application/encryption";
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

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONTH_ES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getStaleSyncMinutes(): number {
  const val = Number(process.env.BINANCE_STALE_SYNC_MINUTES ?? "30");
  return Number.isFinite(val) && val > 0 ? val : 30;
}

function getStartDate(): Date {
  const raw = process.env.BINANCE_SYNC_START_DATE ?? "2018-01-01";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date("2018-01-01") : date;
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

  const subscriptionCheck = requireActiveSubscription(auth.user);
  if (!subscriptionCheck.ok) return subscriptionCheck.response;

  try {
    const connection = await findConnectionByUser(auth.user.id, "BINANCE");
    if (!connection) return fail("No hay conexión con Binance configurada.", 404);
    if (connection.status === "REVOKED") return fail("La conexión ha sido revocada.", 403);

    if (connection.status === "SYNCING") {
      const staleMs = getStaleSyncMinutes() * 60 * 1000;
      const startedAt = connection.updatedAt?.getTime() ?? 0;

      if (Date.now() - startedAt < staleMs) {
        return fail(
          "Ya hay una sincronización en curso. Espera a que finalice o usa 'Reiniciar sync' si lleva más de 5 minutos.",
          409,
        );
      }
    }

    const apiKey = decryptSecret(connection.apiKeyEncrypted);
    const apiSecret = decryptSecret(connection.apiSecretEncrypted);

    const startDate = getStartDate();
    const today = new Date();
    await ensurePeriodsExist(auth.user.id, connection.id, "BINANCE", startDate, today);

    const body = await request.json().catch(() => ({})) as { year?: number; month?: number };
    const forceYear = typeof body.year === "number" ? body.year : null;
    const forceMonth = typeof body.month === "number" ? body.month : null;

    let periods;
    if (forceYear && forceMonth) {
      const specific = await prisma.exchangeSyncPeriod.findFirst({
        where: { userId: auth.user.id, provider: "BINANCE", year: forceYear, month: forceMonth },
      });
      if (!specific) return fail("Período no encontrado.", 404);
      await prisma.exchangeSyncPeriod.update({
        where: { id: specific.id },
        data: { status: "PENDING", importedCount: 0, finishedAt: null, lastError: null },
      });
      periods = [{ ...specific, status: "PENDING" as const }];
    } else {
      periods = await getNextPendingPeriods(
        auth.user.id,
        "BINANCE",
        getMonthsPerRun(),
      );
    }

    if (periods.length === 0) {
      if (connection.status === "SYNCING") await setSyncFinished(connection.id, {});
      return ok(
        {
          imported: 0,
          skipped: 0,
          autoConfirmed: 0,
          pendingReview: 0,
          errors: [],
          taxRebuilt: false,
          allPeriodsSynced: true,
        },
        "Todo el historial está sincronizado. No hay períodos pendientes.",
      );
    }

    await setSyncRunning(connection.id);

    const periodLabels = periods.map((period) => `${MONTH_ES[period.month]} ${period.year}`);

    await logBinanceAuditEvent(request, "BINANCE_SYNC_STARTED", auth.user.id, auth.user.email, {
      provider: "BINANCE",
      status: "SUCCESS",
      connectionId: connection.id,
      periods: periodLabels,
    });

    let totalImported = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];
    const periodResults: Array<{ year: number; month: number; imported: number; status: string }> = [];

    for (const period of periods) {
      await setPeriodRunning(period.id);

      try {
        const result = await syncBinanceMonth(
          auth.user.id,
          connection.id,
          apiKey,
          apiSecret,
          period.year,
          period.month,
        );
        const periodTotal = result.imported + result.skipped;

        if (result.errors.length > 0 && periodTotal === 0) {
          await setPeriodFailed(period.id, result.errors.slice(0, 3).join(" | "), 0);
          allErrors.push(...result.errors.map((error) => `${MONTH_ES[period.month]} ${period.year}: ${error}`));
          periodResults.push({ year: period.year, month: period.month, imported: 0, status: "FAILED" });
        } else if (result.errors.length > 0 && periodTotal > 0) {
          await setPeriodCompleted(period.id, periodTotal);
          allErrors.push(...result.errors.map((error) => `${MONTH_ES[period.month]} ${period.year}: ${error}`));
          periodResults.push({ year: period.year, month: period.month, imported: periodTotal, status: "COMPLETED" });
        } else if (periodTotal === 0) {
          await setPeriodEmpty(period.id);
          periodResults.push({ year: period.year, month: period.month, imported: 0, status: "EMPTY" });
        } else {
          await setPeriodCompleted(period.id, periodTotal);
          periodResults.push({ year: period.year, month: period.month, imported: periodTotal, status: "COMPLETED" });
        }

        totalImported += result.imported;
        totalSkipped += result.skipped;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        await setPeriodFailed(period.id, message, 0);
        allErrors.push(`${MONTH_ES[period.month]} ${period.year}: ${message}`);
        periodResults.push({ year: period.year, month: period.month, imported: 0, status: "FAILED" });
      }
    }

    const hasFailed = allErrors.length > 0;
    if (hasFailed) {
      await setSyncFailed(connection.id, allErrors.slice(0, 3).join(" | "));
    } else {
      await setSyncFinished(connection.id, {});
    }

    await logBinanceAuditEvent(
      request,
      hasFailed ? "BINANCE_SYNC_FAILED" : "BINANCE_SYNC_COMPLETED",
      auth.user.id,
      auth.user.email,
      {
        provider: "BINANCE",
        status: hasFailed ? "FAILED" : "SUCCESS",
        connectionId: connection.id,
        imported: totalImported,
        skipped: totalSkipped,
        errors: allErrors.length,
        periodResults,
      },
    );

    const periodLabel = periodLabels.join(", ");
    const message = hasFailed
      ? `Sincronización parcial (${periodLabel}): ${totalImported} importados, ${totalSkipped} omitidos, ${allErrors.length} errores. Revisa en Importaciones.`
      : `Sincronización completa (${periodLabel}): ${totalImported} importados, ${totalSkipped} omitidos. Revisa en Importaciones.`;

    return ok(
      {
        imported: totalImported,
        skipped: totalSkipped,
        autoConfirmed: 0,
        pendingReview: totalImported,
        errors: allErrors,
        taxRebuilt: false,
        periodResults,
        allPeriodsSynced: false,
      },
      message,
    );
  } catch (error) {
    return serverError(error);
  }
}
