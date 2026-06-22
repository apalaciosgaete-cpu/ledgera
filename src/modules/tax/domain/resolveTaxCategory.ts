import { TaxClassificationService } from "@/services/taxClassificationService";
import { taxPolicy } from "./taxPolicy";

export type SuggestedTaxCategory =
  | "ORDINARY_INCOME"
  | "ORDINARY_INCOME_MINING"
  | "CAPITAL_GAIN"
  | "NON_TAXABLE"
  | "UNCLASSIFIED";

export type SuggestedTaxConfidence = "HIGH" | "MEDIUM" | "LOW";

export type SuggestedTaxRule =
  | "BASE_CAPITAL_GAIN"
  | "HABITUALITY_REVIEW"
  | "NON_SELL_EVENT"
  | "BREAKEVEN_REVIEW";

export type ResolveTaxCategoryInput = {
  eventType: string;
  realizedPnlUsd: number;
  yearlySellCount: number;
  symbolSellCount: number;
};

export type ResolveTaxCategoryResult = {
  suggestedTaxCategory: SuggestedTaxCategory;
  suggestedTaxReason: string;
  suggestedTaxConfidence: SuggestedTaxConfidence;
  suggestedTaxRule: SuggestedTaxRule;
  suggestedTaxContext: string;
};

function normalizeType(value: string): string {
  return String(value).trim().toUpperCase();
}

function isHabitualityReviewNeeded(input: {
  yearlySellCount: number;
  symbolSellCount: number;
}): boolean {
  return (
    input.yearlySellCount >= taxPolicy.habituality.yearlySellThreshold ||
    input.symbolSellCount >= taxPolicy.habituality.symbolSellThreshold
  );
}

function buildContext(input: {
  yearlySellCount: number;
  symbolSellCount: number;
}): string {
  return [
    `Ventas del período: ${input.yearlySellCount}.`,
    `Ventas del activo: ${input.symbolSellCount}.`,
    `Umbral anual: ${taxPolicy.habituality.yearlySellThreshold}.`,
    `Umbral por activo: ${taxPolicy.habituality.symbolSellThreshold}.`
  ].join(" ");
}

export function resolveTaxCategory(
  input: ResolveTaxCategoryInput
): ResolveTaxCategoryResult {
  const normalizedType = normalizeType(input.eventType);
  const statutoryCategory = TaxClassificationService.classify(normalizedType);

  if (normalizedType !== "SELL") {
    return {
      suggestedTaxCategory: statutoryCategory,
      suggestedTaxReason: TaxClassificationService.getDescription(statutoryCategory),
      suggestedTaxConfidence: statutoryCategory === "UNCLASSIFIED" ? "LOW" : "HIGH",
      suggestedTaxRule: "NON_SELL_EVENT",
      suggestedTaxContext: TaxClassificationService.getSiiLine(statutoryCategory)
    };
  }

  const context = buildContext({
    yearlySellCount: input.yearlySellCount,
    symbolSellCount: input.symbolSellCount
  });

  const habitualityReview = isHabitualityReviewNeeded({
    yearlySellCount: input.yearlySellCount,
    symbolSellCount: input.symbolSellCount
  });

  if (habitualityReview) {
    return {
      suggestedTaxCategory: taxPolicy.baseRules.defaultSellCategory,
      suggestedTaxReason:
        "La venta mantiene sugerencia inicial como mayor valor, pero presenta señales de recurrencia que ameritan revisión de habitualidad.",
      suggestedTaxConfidence: "MEDIUM",
      suggestedTaxRule: "HABITUALITY_REVIEW",
      suggestedTaxContext: context
    };
  }

  if (input.realizedPnlUsd > 0) {
    return {
      suggestedTaxCategory: taxPolicy.baseRules.defaultSellCategory,
      suggestedTaxReason:
        "Venta de activo digital con resultado realizado positivo; se sugiere tratamiento inicial como mayor valor.",
      suggestedTaxConfidence: "HIGH",
      suggestedTaxRule: "BASE_CAPITAL_GAIN",
      suggestedTaxContext: context
    };
  }

  if (input.realizedPnlUsd < 0) {
    return {
      suggestedTaxCategory: taxPolicy.baseRules.defaultSellCategory,
      suggestedTaxReason:
        "Venta de activo digital con resultado realizado negativo; se mantiene sugerencia inicial en categoría de mayor valor para revisión tributaria.",
      suggestedTaxConfidence: "MEDIUM",
      suggestedTaxRule: "BASE_CAPITAL_GAIN",
      suggestedTaxContext: context
    };
  }

  return {
    suggestedTaxCategory: taxPolicy.baseRules.defaultSellCategory,
    suggestedTaxReason:
      "Venta de activo digital con resultado neutro; se mantiene sugerencia inicial en categoría de mayor valor por consistencia del criterio base.",
    suggestedTaxConfidence: "MEDIUM",
    suggestedTaxRule: taxPolicy.baseRules.breakEvenRule,
    suggestedTaxContext: context
  };
}
