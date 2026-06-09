export type TaxCategory =
  | "CAPITAL_GAIN"
  | "ORDINARY_INCOME"
  | "ORDINARY_INCOME_MINING"
  | "NON_TAXABLE"
  | "UNCLASSIFIED";

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export class TaxClassificationService {
  static classify(
    type: string,
    fromAddress?: string,
    toAddress?: string,
    userWallets?: string[],
  ): TaxCategory {
    const upperType = type.trim().toUpperCase();

    switch (upperType) {
      case "BUY":
      case "SPOT_BUY":
        return "NON_TAXABLE";
      case "SELL":
      case "SPOT_SELL":
      case "SWAP":
      case "CONVERT":
      case "DUST_CONVERT":
        return "CAPITAL_GAIN";
      case "STAKING":
      case "STAKING_REWARD":
      case "AIRDROP":
      case "INTEREST":
      case "DEFI_YIELD":
        return "ORDINARY_INCOME";
      case "MINING":
        return "ORDINARY_INCOME_MINING";
      case "TRANSFER":
      case "INTERNAL_TRANSFER":
      case "DEPOSIT":
      case "WITHDRAWAL": {
        if (fromAddress && toAddress && userWallets) {
          const ownWallets = new Set(userWallets.map(normalizeAddress));
          const fromIsOwn = ownWallets.has(normalizeAddress(fromAddress));
          const toIsOwn = ownWallets.has(normalizeAddress(toAddress));

          if (fromIsOwn && toIsOwn) return "NON_TAXABLE";
        }

        return upperType === "INTERNAL_TRANSFER" ? "NON_TAXABLE" : "UNCLASSIFIED";
      }
      default:
        return "UNCLASSIFIED";
    }
  }

  static getDescription(category: TaxCategory): string {
    const descriptions: Record<TaxCategory, string> = {
      CAPITAL_GAIN: "Ganancia de Capital (Art. 17, letra m), N 8 LIR)",
      ORDINARY_INCOME: "Renta de Capital Mobiliario (Art. 20, N 2 LIR)",
      ORDINARY_INCOME_MINING: "Incremento Patrimonial (Art. 20, N 5 LIR)",
      NON_TAXABLE: "No Afecto a Impuestos",
      UNCLASSIFIED: "Requiere Clasificacion Manual",
    };

    return descriptions[category];
  }

  static getSiiLine(category: TaxCategory): string {
    const lines: Record<TaxCategory, string> = {
      CAPITAL_GAIN: "Linea 10, Casilla 1032",
      ORDINARY_INCOME: "Linea 10, Casilla 1033",
      ORDINARY_INCOME_MINING: "Linea 10, Casilla 1033",
      NON_TAXABLE: "No declara",
      UNCLASSIFIED: "Requiere revision",
    };

    return lines[category];
  }
}
