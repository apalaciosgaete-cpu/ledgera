export type NormalizedEventType =
  | "SPOT_BUY"
  | "SPOT_SELL"
  | "TRADING_FEE"
  | "EXTERNAL_DEPOSIT"
  | "EXTERNAL_WITHDRAW"
  | "CONVERT"
  | "DUST_CONVERSION"
  | "STAKING_REWARD"
  | "EARN_REWARD"
  | "INTERNAL_TRANSFER"
  | "P2P"
  | "FUNDING"
  | "UNKNOWN";

// Tratamiento tributario bajo normativa chilena (SII)
export type TaxTreatment =
  | "ACQUISITION"   // adquisición — forma base de costo FIFO
  | "DISPOSAL"      // enajenación — realiza mayor/menor valor
  | "EXPENSE"       // gasto/costo — comisión deducible
  | "INCOME"        // renta — staking, earn, recompensas
  | "NEUTRAL"       // sin efecto tributario (movimiento interno)
  | "REVIEW";       // requiere revisión manual

export type InventoryEffect =
  | "ADD"           // aumenta inventario FIFO
  | "REMOVE"        // disminuye inventario FIFO
  | "NEUTRAL"       // sin efecto en inventario
  | "REVIEW";       // impacto depende del contexto

export type EconomicEffect =
  | "ACQUISITION"
  | "DISPOSAL"
  | "EXPENSE"
  | "INCOME"
  | "NEUTRAL"
  | "REVIEW";

export type TaxNormalization = {
  normalizedEventType: NormalizedEventType;
  taxTreatment:        TaxTreatment;
  inventoryEffect:     InventoryEffect;
  economicEffect:      EconomicEffect;
};

// Tabla de clasificación canónica Binance → LEDGERA
const CLASSIFICATION_TABLE: Record<string, TaxNormalization> = {
  "TRADE:BUY": {
    normalizedEventType: "SPOT_BUY",
    taxTreatment:        "ACQUISITION",
    inventoryEffect:     "ADD",
    economicEffect:      "ACQUISITION",
  },
  "TRADE:SELL": {
    normalizedEventType: "SPOT_SELL",
    taxTreatment:        "DISPOSAL",
    inventoryEffect:     "REMOVE",
    economicEffect:      "DISPOSAL",
  },
  "DEPOSIT:DEPOSIT": {
    normalizedEventType: "EXTERNAL_DEPOSIT",
    taxTreatment:        "NEUTRAL",
    inventoryEffect:     "NEUTRAL",
    economicEffect:      "NEUTRAL",
  },
  "WITHDRAW:WITHDRAW": {
    normalizedEventType: "EXTERNAL_WITHDRAW",
    taxTreatment:        "NEUTRAL",
    inventoryEffect:     "NEUTRAL",
    economicEffect:      "NEUTRAL",
  },
  // Futuros endpoints — definidos ahora para no contaminar el schema después
  "CONVERT:BUY": {
    normalizedEventType: "CONVERT",
    taxTreatment:        "ACQUISITION",
    inventoryEffect:     "ADD",
    economicEffect:      "ACQUISITION",
  },
  "CONVERT:SELL": {
    normalizedEventType: "CONVERT",
    taxTreatment:        "DISPOSAL",
    inventoryEffect:     "REMOVE",
    economicEffect:      "DISPOSAL",
  },
  "DUST:BUY": {
    normalizedEventType: "DUST_CONVERSION",
    taxTreatment:        "REVIEW",
    inventoryEffect:     "REVIEW",
    economicEffect:      "REVIEW",
  },
  "STAKING:DEPOSIT": {
    normalizedEventType: "STAKING_REWARD",
    taxTreatment:        "INCOME",
    inventoryEffect:     "ADD",
    economicEffect:      "INCOME",
  },
  "EARN:DEPOSIT": {
    normalizedEventType: "EARN_REWARD",
    taxTreatment:        "INCOME",
    inventoryEffect:     "ADD",
    economicEffect:      "INCOME",
  },
};

const UNKNOWN_CLASSIFICATION: TaxNormalization = {
  normalizedEventType: "UNKNOWN",
  taxTreatment:        "REVIEW",
  inventoryEffect:     "REVIEW",
  economicEffect:      "REVIEW",
};

export function classifyBinanceEvent(
  externalType: string,
  movementType: string,
): TaxNormalization {
  const key = `${externalType}:${movementType}`;
  return CLASSIFICATION_TABLE[key] ?? UNKNOWN_CLASSIFICATION;
}
