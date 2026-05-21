import { prisma } from "@/lib/prisma";
import { confirmImport } from "../infrastructure/exchangeImportRepository";
import { assertPeriodOpen } from "@/modules/tax/domain/periodGuard";

// Eventos que se auto-confirman sin intervención manual.
const AUTO_CONFIRM_TYPES = new Set([
  "SPOT_BUY",
  "SPOT_SELL",
  "EXTERNAL_DEPOSIT",
  "EXTERNAL_WITHDRAW",
]);

// Eventos que siempre quedan para revisión manual.
const MANUAL_REVIEW_TYPES = new Set([
  "DUST_CONVERSION",
  "CONVERT",
  "STAKING_REWARD",
  "EARN_REWARD",
  "P2P",
  "FUNDING",
  "UNKNOWN",
]);

type ParsedNormalized = {
  externalId:   string;
  movementType: string;
  symbol:       string;
  quantity:     number;
  priceUsd:     number;
  feeUsd:       number;
  occurredAt:   string; // ISO string when deserialized from JSON
};

export type AutoConfirmResult = {
  confirmed:     number;
  skippedReview: number;
  errors:        string[];
};

/**
 * Auto-confirma las importaciones PENDING de Binance que son clasificables
 * de forma segura sin intervención del usuario.
 *
 * Reglas:
 *   SPOT_BUY / SPOT_SELL   → crea PortfolioMovement + confirma
 *   EXTERNAL_DEPOSIT/WITHDRAW → confirma sin movimiento (neutral)
 *   REVIEW / UNKNOWN / DUST → queda en cola para revisión manual
 *
 * rebuildTaxEvents NO se llama aquí — el caller lo hace una sola vez al final.
 */
export async function autoConfirmImports(
  userId: string,
): Promise<AutoConfirmResult> {
  const pending = await prisma.exchangeImportRecord.findMany({
    where:   { userId, status: "PENDING" },
    orderBy: { occurredAt: "asc" },
  });

  let confirmed     = 0;
  let skippedReview = 0;
  const errors: string[] = [];

  for (const record of pending) {
    try {
      const eventType = record.normalizedEventType ?? "UNKNOWN";

      // Requiere revisión manual explícita
      if (
        MANUAL_REVIEW_TYPES.has(eventType) ||
        record.taxTreatment   === "REVIEW"  ||
        record.inventoryEffect === "REVIEW"
      ) {
        skippedReview++;
        continue;
      }

      // No está en la lista de auto-confirmables
      if (!AUTO_CONFIRM_TYPES.has(eventType)) {
        skippedReview++;
        continue;
      }

      const normalized = JSON.parse(record.normalizedJson ?? "{}") as ParsedNormalized;

      // ── Depósitos y retiros: confirmar sin movimiento de portafolio ──
      if (eventType === "EXTERNAL_DEPOSIT" || eventType === "EXTERNAL_WITHDRAW") {
        await confirmImport(record.id, userId, `N/A-${record.id}`);
        confirmed++;
        continue;
      }

      // ── SPOT_BUY / SPOT_SELL: crear movimiento en portafolio ──

      // Verificar que el período tributario esté abierto
      const occurredAt = new Date(normalized.occurredAt);
      try {
        await assertPeriodOpen(occurredAt, userId);
      } catch {
        // Período cerrado — dejar en PENDING para revisión
        skippedReview++;
        continue;
      }

      const movement = await prisma.portfolioMovement.create({
        data: {
          userId,
          type:       normalized.movementType,
          symbol:     normalized.symbol,
          quantity:   normalized.quantity,
          priceUsd:   normalized.priceUsd,
          feeUsd:     normalized.feeUsd,
          executedAt: occurredAt,
          source:     "BINANCE",
          externalId: normalized.externalId,
        },
      });

      await confirmImport(record.id, userId, movement.id);
      confirmed++;
    } catch (err) {
      errors.push(
        `${record.externalId}: ${err instanceof Error ? err.message : "error desconocido"}`,
      );
    }
  }

  return { confirmed, skippedReview, errors };
}
