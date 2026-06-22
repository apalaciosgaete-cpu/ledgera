import type { LegalSource } from "../domain/types";
import { chileCryptoTaxSources } from "./chileCryptoTax";

export const legalCatalog: LegalSource[] = [
  ...chileCryptoTaxSources,
];

export { chileCryptoTaxSources };
