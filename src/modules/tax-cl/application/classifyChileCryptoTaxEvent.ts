export type ChileTaxCategory =
  | "RENTA_CAPITAL"      // Capital gains — Art. 17 N°8 LIR
  | "INGRESO_TRIBUTABLE" // Taxable income — staking, rewards
  | "NEUTRO"             // No tax effect — internal transfers, P2P fiat
  | "PENDIENTE";         // Needs manual review

export type ChileTaxEventClassification = {
  category:    ChileTaxCategory;
  description: string;
  reference:   string;
};

const CLASSIFICATION_MAP: Record<string, ChileTaxEventClassification> = {
  SPOT_BUY: {
    category:    "NEUTRO",
    description: "Compra de criptomoneda — adquisición de activo, no genera renta",
    reference:   "Art. 17 N°8 LIR — costo de adquisición",
  },
  SPOT_SELL: {
    category:    "RENTA_CAPITAL",
    description: "Venta de criptomoneda — mayor valor entre precio de venta y costo de adquisición",
    reference:   "Art. 17 N°8 LIR — mayor valor",
  },
  EXTERNAL_DEPOSIT: {
    category:    "PENDIENTE",
    description: "Depósito externo — requiere clasificación manual según origen de fondos",
    reference:   "Pendiente de clasificación",
  },
  EXTERNAL_WITHDRAWAL: {
    category:    "NEUTRO",
    description: "Retiro a wallet propia — no genera renta, cambio de custodia",
    reference:   "Sin efecto tributario si es wallet propia",
  },
  P2P: {
    category:    "NEUTRO",
    description: "Operación P2P con fiat — clasificación depende del subyacente",
    reference:   "Análisis caso a caso",
  },
  STAKING_REWARD: {
    category:    "INGRESO_TRIBUTABLE",
    description: "Recompensa de staking — ingreso percibido, tributación en año percepción",
    reference:   "Art. 20 N°5 LIR — otros ingresos",
  },
  AIRDROP: {
    category:    "INGRESO_TRIBUTABLE",
    description: "Airdrop recibido — ingreso a valor de mercado en fecha de recepción",
    reference:   "Art. 20 N°5 LIR — otros ingresos",
  },
  INTERNAL_TRANSFER: {
    category:    "NEUTRO",
    description: "Transferencia interna entre cuentas propias — sin efecto tributario",
    reference:   "Neutro",
  },
  CONVERT: {
    category:    "RENTA_CAPITAL",
    description: "Conversión entre criptomonedas — evento de realización según SII criterio",
    reference:   "Art. 17 N°8 LIR aplicado por analogía",
  },
  DUST_CONVERT: {
    category:    "RENTA_CAPITAL",
    description: "Conversión de dust — monto menor, mismo tratamiento que conversión",
    reference:   "Art. 17 N°8 LIR",
  },
};

export function classifyChileCryptoTaxEvent(
  normalizedEventType: string,
): ChileTaxEventClassification {
  return CLASSIFICATION_MAP[normalizedEventType] ?? {
    category:    "PENDIENTE",
    description: `Tipo de evento desconocido: ${normalizedEventType}`,
    reference:   "Requiere revisión manual",
  };
}
