// src/modules/tax/domain/globalComplementaryTax.ts

export type GlobalComplementaryTaxBracket = {
  /** Año Tributario SII al que pertenece el tramo. */
  taxYear: number;
  /** Límite inferior inclusivo de renta imponible anual en CLP enteros. */
  fromClpInclusive: number;
  /** Límite superior inclusivo de renta imponible anual en CLP enteros. null = sin tope. */
  toClpInclusive: number | null;
  /** Factor oficial SII para cálculo: renta imponible anual × factor − rebaja. */
  factor: number;
  /** Cantidad a rebajar oficial SII para el tramo. */
  deductionClp: number;
  /** Tasa marginal del tramo expresada como porcentaje. */
  marginalRatePct: number;
};

export type GlobalComplementaryTaxTable = {
  taxYear: number;
  legalReference: "LIR_ART_52";
  source: "SII";
  sourceUrl: string;
  brackets: GlobalComplementaryTaxBracket[];
};

export type GlobalComplementaryTaxCalculation = {
  taxYear: number;
  taxableIncomeClp: number;
  taxClp: number;
  factor: number;
  deductionClp: number;
  marginalRatePct: number;
  bracket: GlobalComplementaryTaxBracket;
};

export const DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR = 2026;

/**
 * Tabla de cálculo del Impuesto Global Complementario vigente para AT 2026,
 * contribuyentes del artículo 52 de la Ley sobre Impuesto a la Renta.
 *
 * Fuente oficial SII:
 * https://www.sii.cl/valores_y_fechas/renta/2026/personas_naturales.html
 */
export const GLOBAL_COMPLEMENTARY_TAX_TABLES: Record<
  number,
  GlobalComplementaryTaxTable
> = {
  2026: {
    taxYear: 2026,
    legalReference: "LIR_ART_52",
    source: "SII",
    sourceUrl:
      "https://www.sii.cl/valores_y_fechas/renta/2026/personas_naturales.html",
    brackets: [
      {
        taxYear: 2026,
        fromClpInclusive: 0,
        toClpInclusive: 11_265_804,
        factor: 0,
        deductionClp: 0,
        marginalRatePct: 0,
      },
      {
        taxYear: 2026,
        fromClpInclusive: 11_265_805,
        toClpInclusive: 25_035_120,
        factor: 0.04,
        deductionClp: 450_632.16,
        marginalRatePct: 4,
      },
      {
        taxYear: 2026,
        fromClpInclusive: 25_035_121,
        toClpInclusive: 41_725_200,
        factor: 0.08,
        deductionClp: 1_452_036.96,
        marginalRatePct: 8,
      },
      {
        taxYear: 2026,
        fromClpInclusive: 41_725_201,
        toClpInclusive: 58_415_280,
        factor: 0.135,
        deductionClp: 3_746_922.96,
        marginalRatePct: 13.5,
      },
      {
        taxYear: 2026,
        fromClpInclusive: 58_415_281,
        toClpInclusive: 75_105_360,
        factor: 0.23,
        deductionClp: 9_296_374.56,
        marginalRatePct: 23,
      },
      {
        taxYear: 2026,
        fromClpInclusive: 75_105_361,
        toClpInclusive: 100_140_480,
        factor: 0.304,
        deductionClp: 14_854_171.2,
        marginalRatePct: 30.4,
      },
      {
        taxYear: 2026,
        fromClpInclusive: 100_140_481,
        toClpInclusive: 258_696_240,
        factor: 0.35,
        deductionClp: 19_460_633.28,
        marginalRatePct: 35,
      },
      {
        taxYear: 2026,
        fromClpInclusive: 258_696_241,
        toClpInclusive: null,
        factor: 0.4,
        deductionClp: 32_395_445.28,
        marginalRatePct: 40,
      },
    ],
  },
};

function normalizeTaxableIncomeClp(taxableIncomeClp: number): number {
  if (!Number.isFinite(taxableIncomeClp)) {
    throw new RangeError("taxableIncomeClp must be a finite number");
  }

  return Math.max(0, Math.round(taxableIncomeClp));
}

export function getGlobalComplementaryTaxTable(
  taxYear = DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR,
): GlobalComplementaryTaxTable {
  const table = GLOBAL_COMPLEMENTARY_TAX_TABLES[taxYear];

  if (!table) {
    throw new RangeError(
      `Unsupported Global Complementary Tax year: ${taxYear}`,
    );
  }

  return table;
}

export function findGlobalComplementaryTaxBracket(input: {
  taxableIncomeClp: number;
  taxYear?: number;
}): GlobalComplementaryTaxBracket {
  const taxYear = input.taxYear ?? DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR;
  const taxableIncomeClp = normalizeTaxableIncomeClp(input.taxableIncomeClp);
  const table = getGlobalComplementaryTaxTable(taxYear);
  const bracket = table.brackets.find(
    (item) =>
      taxableIncomeClp >= item.fromClpInclusive &&
      (item.toClpInclusive === null ||
        taxableIncomeClp <= item.toClpInclusive),
  );

  if (!bracket) {
    throw new RangeError(
      `No Global Complementary Tax bracket found for ${taxableIncomeClp} CLP in tax year ${taxYear}`,
    );
  }

  return bracket;
}

export function calculateGlobalComplementaryTax(input: {
  taxableIncomeClp: number;
  taxYear?: number;
}): GlobalComplementaryTaxCalculation {
  const taxYear = input.taxYear ?? DEFAULT_GLOBAL_COMPLEMENTARY_TAX_YEAR;
  const taxableIncomeClp = normalizeTaxableIncomeClp(input.taxableIncomeClp);
  const bracket = findGlobalComplementaryTaxBracket({
    taxableIncomeClp,
    taxYear,
  });
  const rawTaxClp = taxableIncomeClp * bracket.factor - bracket.deductionClp;
  const taxClp = Math.max(0, Math.round(rawTaxClp));

  return {
    taxYear,
    taxableIncomeClp,
    taxClp,
    factor: bracket.factor,
    deductionClp: bracket.deductionClp,
    marginalRatePct: bracket.marginalRatePct,
    bracket,
  };
}
