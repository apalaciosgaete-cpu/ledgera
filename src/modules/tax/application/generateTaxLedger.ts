import { prisma } from "@/lib/prisma";

function resolveSiiClassification(realizedGainClp: number): string {
  if (realizedGainClp > 0.001)  return "MAYOR_VALOR";
  if (realizedGainClp < -0.001) return "MENOR_VALOR";
  return "NEUTRO";
}

export type GenerateLedgerOptions = {
  taxYear?: number;
};

export type GenerateLedgerResult = {
  created: number;
  taxYear?: number;
};

/**
 * Genera (o regenera) los asientos del ledger tributario chileno
 * a partir de los TaxEvents existentes del usuario.
 *
 * - Solo borra entradas source=SYSTEM. Las entradas MANUAL o ACCOUNTANT
 *   creadas por el contador quedan intactas.
 * - Si se especifica taxYear, opera solo sobre ese año.
 *
 * Alcance v0.2.0.1: SELL → DISPOSAL → clasificación SII mayor/menor valor.
 */
export async function generateTaxLedger(
  userId: string,
  options: GenerateLedgerOptions = {},
): Promise<GenerateLedgerResult> {
  const { taxYear } = options;

  // Borrar solo entradas SYSTEM (preservar MANUAL / ACCOUNTANT)
  await prisma.taxLedgerEntry.deleteMany({
    where: {
      userId,
      source: "SYSTEM",
      ...(taxYear ? { taxYear } : {}),
    },
  });

  // Leer TaxEvents relevantes (solo SELL por ahora)
  const taxEvents = await prisma.taxEvent.findMany({
    where: {
      userId,
      eventType: "SELL",
      ...(taxYear ? { taxYear } : {}),
    },
    orderBy: { executedAt: "asc" },
  });

  if (taxEvents.length === 0) return { created: 0, taxYear };

  const entries = taxEvents.map((event) => ({
    userId,
    movementId:        event.movementId,
    taxEventId:        event.id,
    taxYear:           event.taxYear,
    taxMonth:          event.executedAt.getUTCMonth() + 1,
    ledgerType:        "DISPOSAL",
    ledgerCategory:    "ENAJENACION_ACTIVO_DIGITAL",
    assetSymbol:       event.symbol,
    quantity:          event.quantity,
    proceedsClp:       event.proceedsGrossClp,
    costBasisClp:      event.costBasisClp,
    realizedGainClp:   event.realizedPnlClp,
    taxTreatment:      "DISPOSAL",
    siiClassification: resolveSiiClassification(event.realizedPnlClp),
    source:            "SYSTEM",
  }));

  await prisma.taxLedgerEntry.createMany({ data: entries });

  return { created: entries.length, taxYear };
}
