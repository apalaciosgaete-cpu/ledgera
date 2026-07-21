export const PROFESSIONAL_EXTRA_CLIENT_PRODUCT = "PROFESSIONAL_EXTRA_CLIENT" as const;
export const PROFESSIONAL_EXTRA_CLIENT_NET_CLP = 4_990;
export const PROFESSIONAL_EXTRA_CLIENT_TAX_CLP = 948;
export const PROFESSIONAL_EXTRA_CLIENT_TOTAL_CLP = 5_938;

export const professionalExtraClientPrice = {
  product: PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
  label: "Cliente adicional Profesional",
  currency: "CLP" as const,
  interval: "MONTHLY" as const,
  netAmount: PROFESSIONAL_EXTRA_CLIENT_NET_CLP,
  taxAmount: PROFESSIONAL_EXTRA_CLIENT_TAX_CLP,
  amount: PROFESSIONAL_EXTRA_CLIENT_TOTAL_CLP,
};
