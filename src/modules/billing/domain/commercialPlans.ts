export const CHILE_VAT_RATE = 0.19;

export const CommercialPlan = {
  FREE: "FREE",
  PERSONAL: "PERSONAL",
  PROFESIONAL: "PROFESIONAL",
} as const;

export type CommercialPlan =
  (typeof CommercialPlan)[keyof typeof CommercialPlan];

export type CommercialPrice = {
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
};

export type CommercialPlanDefinition = {
  plan: CommercialPlan;
  databaseValue: "BASICO" | "PERSONAL" | "PROFESIONAL";
  label: string;
  sellable: boolean;
  monthly: CommercialPrice;
  annual: CommercialPrice;
  includedImportSources: number | null;
  includedMovements: number | null;
  includedClients: number;
};

export function calculateCommercialPrice(netAmount: number): CommercialPrice {
  const taxAmount = Math.round(netAmount * CHILE_VAT_RATE);
  return {
    netAmount,
    taxAmount,
    grossAmount: netAmount + taxAmount,
  };
}

export const COMMERCIAL_PLANS: Record<CommercialPlan, CommercialPlanDefinition> = {
  FREE: {
    plan: "FREE",
    databaseValue: "BASICO",
    label: "Gratuito",
    sellable: true,
    monthly: calculateCommercialPrice(0),
    annual: calculateCommercialPrice(0),
    includedImportSources: 1,
    includedMovements: 50,
    includedClients: 0,
  },
  PERSONAL: {
    plan: "PERSONAL",
    databaseValue: "PERSONAL",
    label: "Personal",
    sellable: true,
    monthly: calculateCommercialPrice(5_990),
    annual: calculateCommercialPrice(65_890),
    includedImportSources: null,
    includedMovements: null,
    includedClients: 1,
  },
  PROFESIONAL: {
    plan: "PROFESIONAL",
    databaseValue: "PROFESIONAL",
    label: "Profesional",
    sellable: true,
    monthly: calculateCommercialPrice(29_990),
    annual: calculateCommercialPrice(329_890),
    includedImportSources: null,
    includedMovements: null,
    includedClients: 5,
  },
};

export const PROFESSIONAL_ADDITIONAL_CLIENT = {
  monthly: calculateCommercialPrice(4_990),
};

export function getCommercialPlan(plan: CommercialPlan) {
  return COMMERCIAL_PLANS[plan];
}
