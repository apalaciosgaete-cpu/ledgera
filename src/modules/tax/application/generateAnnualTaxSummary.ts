import { prisma } from "@/lib/prisma";

export type GenerateAnnualSummaryOptions = {
  taxYear?: number;
};

export type GenerateAnnualSummaryResult = {
  upserted: number;
  years: number[];
};

/**
 * Genera (o regenera) el resumen anual tributario a partir de los TaxLedgerEntries.
 *
 * - grossProceedsClp: suma de todos los ingresos brutos del período
 * - costBasisClp: suma de todos los costos tributarios FIFO
 * - realizedGainClp: suma de ganancias realizadas (MAYOR_VALOR únicamente)
 * - realizedLossClp: magnitud de pérdidas realizadas (MENOR_VALOR únicamente)
 * - netTaxableGainClp: ganancia neta = ingresos - costos (puede ser negativo)
 * - preliminaryTaxBaseClp: base imponible preliminar = max(0, netTaxableGainClp)
 * - reviewCount: importaciones pendientes de confirmación para el período
 *
 * No calcula impuestos finales ni tramos de renta global complementaria.
 */
export async function generateAnnualTaxSummary(
  userId: string,
  options: GenerateAnnualSummaryOptions = {},
): Promise<GenerateAnnualSummaryResult> {
  const { taxYear } = options;

  let years: number[];
  if (taxYear) {
    years = [taxYear];
  } else {
    const distinct = await prisma.taxLedgerEntry.findMany({
      where:    { userId },
      distinct: ["taxYear"],
      select:   { taxYear: true },
      orderBy:  { taxYear: "asc" },
    });
    years = distinct.map((d) => d.taxYear);
  }

  if (years.length === 0) return { upserted: 0, years: [] };

  for (const year of years) {
    const [allAgg, gainAgg, lossAgg, taxableEventCount, reviewCount] = await Promise.all([
      prisma.taxLedgerEntry.aggregate({
        where: { userId, taxYear: year },
        _sum:  { proceedsClp: true, costBasisClp: true, realizedGainClp: true },
      }),
      prisma.taxLedgerEntry.aggregate({
        where: { userId, taxYear: year, siiClassification: "MAYOR_VALOR" },
        _sum:  { realizedGainClp: true },
      }),
      prisma.taxLedgerEntry.aggregate({
        where: { userId, taxYear: year, siiClassification: "MENOR_VALOR" },
        _sum:  { realizedGainClp: true },
      }),
      prisma.taxLedgerEntry.count({
        where: { userId, taxYear: year, siiClassification: "MAYOR_VALOR" },
      }),
      prisma.exchangeImportRecord.count({
        where: {
          userId,
          status:     { in: ["PENDING", "REVIEW"] },
          occurredAt: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt:  new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      }),
    ]);

    const grossProceedsClp      = allAgg._sum.proceedsClp    ?? 0;
    const costBasisClp          = allAgg._sum.costBasisClp   ?? 0;
    const realizedGainClp       = gainAgg._sum.realizedGainClp ?? 0;
    const realizedLossClp       = Math.abs(lossAgg._sum.realizedGainClp ?? 0);
    const netTaxableGainClp     = allAgg._sum.realizedGainClp ?? 0;
    const preliminaryTaxBaseClp = Math.max(0, netTaxableGainClp);

    await prisma.annualTaxSummary.upsert({
      where:  { userId_taxYear: { userId, taxYear: year } },
      update: {
        grossProceedsClp,
        costBasisClp,
        realizedGainClp,
        realizedLossClp,
        netTaxableGainClp,
        reviewCount,
        taxableEventCount,
        preliminaryTaxBaseClp,
        source: "SYSTEM",
      },
      create: {
        userId,
        taxYear: year,
        grossProceedsClp,
        costBasisClp,
        realizedGainClp,
        realizedLossClp,
        netTaxableGainClp,
        reviewCount,
        taxableEventCount,
        preliminaryTaxBaseClp,
        source: "SYSTEM",
      },
    });
  }

  return { upserted: years.length, years };
}
