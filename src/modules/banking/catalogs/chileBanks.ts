// src/modules/banking/catalogs/chileBanks.ts
// Catálogo de bancos que operan en Chile, regulados por la CMF (ex SBIF).
// Fuente: CMF — Comisión para el Mercado Financiero

export type ConnectionMethod = "api" | "aggregator" | "manual_upload";
export type BankStatus = "available" | "coming_soon";

export interface ChileBank {
  id: string;
  name: string;
  shortName: string;
  cmfCode: string;
  type: "bank";
  connectionMethods: ConnectionMethod[];
  status: BankStatus;
  domain: string;
}

const BANK_CONNECTORS: ConnectionMethod[] = ["api", "aggregator", "manual_upload"];

/**
 * Bancos que operan en Chile regulados por la CMF.
 * `cmfCode` corresponde al código institucional asignado por la CMF (ex SBIF).
 */
export const CHILE_BANKS: ChileBank[] = [
  {
    id: "santander",
    name: "Banco Santander Chile",
    shortName: "Santander",
    cmfCode: "037",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "santander.cl",
  },
  {
    id: "chile",
    name: "Banco de Chile",
    shortName: "Banco de Chile",
    cmfCode: "001",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bancochile.cl",
  },
  {
    id: "bci",
    name: "BCI",
    shortName: "BCI",
    cmfCode: "016",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bci.cl",
  },
  {
    id: "estado",
    name: "BancoEstado",
    shortName: "BancoEstado",
    cmfCode: "012",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bancoestado.cl",
  },
  {
    id: "itau",
    name: "Itaú Corpbanca",
    shortName: "Itaú",
    cmfCode: "027",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "itau.cl",
  },
  {
    id: "scotiabank",
    name: "Scotiabank Chile",
    shortName: "Scotiabank",
    cmfCode: "048",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "scotiabank.cl",
  },
  {
    id: "falabella",
    name: "Banco Falabella",
    shortName: "Banco Falabella",
    cmfCode: "049",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bancofalabella.cl",
  },
  {
    id: "security",
    name: "Banco Security",
    shortName: "Security",
    cmfCode: "059",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "security.cl",
  },
  {
    id: "bice",
    name: "Banco BICE",
    shortName: "BICE",
    cmfCode: "028",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bice.cl",
  },
  {
    id: "consorcio",
    name: "Banco Consorcio",
    shortName: "Banco Consorcio",
    cmfCode: "065",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bancoconsorcio.cl",
  },
  {
    id: "internacional",
    name: "Banco Internacional",
    shortName: "Banco Internacional",
    cmfCode: "009",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bancointernacional.cl",
  },
  {
    id: "ripley",
    name: "Banco Ripley",
    shortName: "Banco Ripley",
    cmfCode: "053",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bancoripley.cl",
  },
  {
    id: "hsbc",
    name: "HSBC Bank Chile",
    shortName: "HSBC",
    cmfCode: "051",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "hsbc.cl",
  },
  {
    id: "btg-pactual",
    name: "Banco BTG Pactual Chile",
    shortName: "BTG Pactual",
    cmfCode: "075",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "btgpactual.cl",
  },
  {
    id: "jp-morgan",
    name: "JP Morgan Chile",
    shortName: "JP Morgan",
    cmfCode: "052",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "jpmorgan.com",
  },
  {
    id: "do-brasil",
    name: "Banco do Brasil Chile",
    shortName: "Banco do Brasil",
    cmfCode: "032",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bb.com.br",
  },
  {
    id: "nacion-argentina",
    name: "Banco de la Nación Argentina Chile",
    shortName: "Nación Argentina",
    cmfCode: "034",
    type: "bank",
    connectionMethods: BANK_CONNECTORS,
    status: "available",
    domain: "bna.com.ar",
  },
];

/** Busca un banco por su id */
export function findBankById(id: string): ChileBank | undefined {
  return CHILE_BANKS.find((b) => b.id === id);
}

/** Retorna solo los bancos disponibles */
export function getAvailableBanks(): ChileBank[] {
  return CHILE_BANKS.filter((b) => b.status === "available");
}

/** Retorna solo los bancos próximos */
export function getComingSoonBanks(): ChileBank[] {
  return CHILE_BANKS.filter((b) => b.status === "coming_soon");
}

/** Retorna logo del banco desde servicio de logos por dominio */
export function getBankLogoUrl(domain: string) {
  return `https://logo.clearbit.com/${domain}`;
}
