// src/modules/tax/domain/taxPolicy.ts

import type { SuggestedTaxCategory, SuggestedTaxRule } from "./resolveTaxCategory";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export type TaxRegime = "PERSONA_NATURAL" | "EMPRESA";

export type TaxPolicy = {
  regime: TaxRegime;

  habituality: {
    // Circular SII N°23/2021 — umbral de habitualidad para persona natural
    // >6 ventas/año o >4 ventas del mismo símbolo → HABITUAL
    yearlySellThreshold: number;
    symbolSellThreshold: number;
  };

  rates: {
    // Persona natural habitual → IGC (Impuesto Global Complementario)
    // Tasa marginal máxima vigente: 40% (Art. 52 LIR)
    igcMaxRatePct: number;

    // Persona natural no habitual → Impuesto Único 2da Categoría
    // Tasa: 35% sobre ganancia de capital (Art. 17 N°8 LIR)
    capitalGainFlatRatePct: number;

    // Empresa (Régimen General) → Impuesto de Primera Categoría
    // Tasa vigente 2024: 27% (Art. 20 LIR)
    firstCategoryRatePct: number;
  };

  utm: {
    // UTM referencial para cálculo de exenciones
    // Actualizar mensualmente desde www.sii.cl
    // Valor UTM mayo 2025: $68.306 CLP
    valueClp: number;
    asOf: string; // ISO date — mes de referencia
  };

  baseRules: {
    defaultSellCategory: SuggestedTaxCategory;
    breakEvenRule: SuggestedTaxRule;
  };

  sii: {
    // Formulario 22 — líneas de declaración para criptoactivos
    // Fuente: Res. Ex. SII N°6/2022 + Circular 23/2021
    form22: {
      habitualGainLine: number;   // línea 8 — rentas del capital habitual
      nonHabitualGainLine: number; // línea 53 — mayor valor no habitual
      lossLine: number;            // línea 20 — pérdidas imputables
    };

    // Código de actividad económica para exchange/operadores cripto
    activityCode: number; // 6499 — otras actividades de servicios financieros

    // Moneda base requerida por SII para declaración
    declarationCurrency: "CLP";

    // Precisión decimal exigida en declaración SII
    decimalPlaces: number;
  };
};

// ─── Política vigente ──────────────────────────────────────────────────────────

export const taxPolicy: TaxPolicy = {
  regime: "PERSONA_NATURAL",

  habituality: {
    yearlySellThreshold: 6,
    symbolSellThreshold: 4,
  },

  rates: {
    igcMaxRatePct:          40,
    capitalGainFlatRatePct: 35,
    firstCategoryRatePct:   27,
  },

  utm: {
    valueClp: 68_306,
    asOf:     "2025-05-01",
  },

  baseRules: {
    defaultSellCategory: "CAPITAL_GAIN",
    breakEvenRule:       "BREAKEVEN_REVIEW",
  },

  sii: {
    form22: {
      habitualGainLine:    8,
      nonHabitualGainLine: 53,
      lossLine:            20,
    },
    activityCode:        6499,
    declarationCurrency: "CLP",
    decimalPlaces:       0, // SII exige enteros en CLP
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Determina si un contribuyente es habitual según umbrales SII.
 * Circular SII N°23/2021.
 */
export function isHabitual(
  yearlySellCount: number,
  symbolSellCount: number,
): boolean {
  return (
    yearlySellCount > taxPolicy.habituality.yearlySellThreshold ||
    symbolSellCount > taxPolicy.habituality.symbolSellThreshold
  );
}

/**
 * Retorna la tasa impositiva aplicable según habitualidad y régimen.
 */
export function getApplicableRatePct(habitual: boolean): number {
  if (taxPolicy.regime === "EMPRESA") {
    return taxPolicy.rates.firstCategoryRatePct;
  }
  return habitual
    ? taxPolicy.rates.igcMaxRatePct
    : taxPolicy.rates.capitalGainFlatRatePct;
}

/**
 * Convierte un monto USD a CLP y lo redondea a entero para declaración SII.
 * SII no acepta decimales en CLP.
 */
export function roundForSIIDeclaration(amountClp: number): number {
  return Math.round(amountClp);
}