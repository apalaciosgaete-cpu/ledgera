import { prisma } from "@/lib/prisma";
import { confirmImport } from "../infrastructure/exchangeImportRepository";

// Eventos que se auto-confirman sin intervención manual.
const AUTO_CONFIRM_TYPES = new Set([
  "SPOT_BUY",
  "SPOT_SELL",
  "EXTERNAL_DEPOSIT",
  "EXTERNAL_WITHDRAW",
]);

type ParsedNormalized = {
  externalId:   string;
  movementType: string;
  symbol:       string;
  quantity:     number;
  priceUsd:     number;
  feeUsd:       number;
  occurredAt:   string;
};

export type AutoConfirmResult = {
  confirmed:     number;
  skippedReview: number;
  errors:        string[];
};

/**
 * Auto-confirma las importaciones PENDING de Binance.
 *
 * SPOT_BUY / SPOT_SELL        → crea PortfolioMovement + CONFIRMED
 * EXTERNAL_DEPOSIT/WITHDRAW   → CONFIRMED sin movimiento (neutral)
 * Todo lo demás               → REVIEW (aparece en tabla de excepciones)
 *
 * Sin assertPeriodOpen: la importación histórica debe funcionar
 * independientemente del estado de cierre tributario del período.
 * rebuildTaxEvents NO se llama aquí — el caller lo hace al final.
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

      // Requiere revisión manual → marcar REVIEW en DB para que aparezca
      // en la tabla de excepciones, no mezclado con pendientes transitorios.
      if (
        !AUTO_CONFIRM_TYPES.has(eventType) ||
        record.taxTreatment    === "REVIEW" ||
        record.inventoryEffect === "REVIEW"
      ) {
        await prisma.exchangeImportRecord.update({
          where: { id: record.id },
          data:  { status: "REVIEW" },
        });
        skippedReview++;
        continue;
      }

      const normalized = JSON.parse(record.normalizedJson ?? "{}") as ParsedNormalized;

      // ── Depósitos y retiros: confirmar sin movimiento de portafolio ──
      if (eventType === "EXTERNAL_DEPOSIT" || eventType === "EXTERNAL_WITHDRAW") {
        await confirmImport(record.id, userId, null);
        confirmed++;
        continue;
      }

      // ── SPOT_BUY / SPOT_SELL: crear movimiento en portafolio ──
      const occurredAt = new Date(normalized.occurredAt);

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
