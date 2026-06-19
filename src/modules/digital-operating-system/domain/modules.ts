import type { DigitalModuleDefinition } from "./types";

export const cryptoFirstModules: DigitalModuleDefinition[] = [
  {
    key: "digitalWealth",
    label: "Patrimonio Digital",
    href: "/patrimonio-digital",
    description: "Vista consolidada del patrimonio digital, distribución por activo y estado general de revisión.",
    primaryQuestion: "Cuéntame qué patrimonio digital quieres ordenar.",
    examples: ["Tengo BTC y USDT", "Quiero ver mi patrimonio digital", "Necesito ordenar mis activos", "Tengo fondos en varios exchanges"],
    status: "PARTIAL",
  },
  {
    key: "cryptoAssets",
    label: "Cryptoactivos",
    href: "/cryptoactivos",
    description: "Detalle de activos digitales: BTC, ETH, SOL, stablecoins, tokens, staking, DeFi y NFTs.",
    primaryQuestion: "¿Qué cryptoactivos necesitas revisar?",
    examples: ["Vendí Bitcoin", "Tengo ETH en staking", "Recibí USDT", "Compré SOL"],
    status: "PARTIAL",
  },
  {
    key: "exchanges",
    label: "Exchanges",
    href: "/exchanges",
    description: "Registro y revisión de plataformas usadas: Binance, Bybit, Coinbase, Kraken y otras.",
    primaryQuestion: "¿Qué exchange necesitas revisar?",
    examples: ["Tengo movimientos en Binance", "Importar CSV de Bybit", "Revisar retiros de Kraken", "Ordenar cuentas de exchange"],
    status: "EMPTY",
  },
  {
    key: "wallets",
    label: "Wallets",
    href: "/wallets",
    description: "Custodia y trazabilidad de wallets: Ledger, Trezor, Metamask, Rabby y direcciones manuales.",
    primaryQuestion: "¿Qué wallet o dirección necesitas registrar?",
    examples: ["Tengo una Ledger", "Registrar Metamask", "Revisar una dirección", "Mover fondos a autocustodia"],
    status: "EMPTY",
  },
  {
    key: "sourceOfFunds",
    label: "Origen de Fondos",
    href: "/origen-fondos",
    description: "Mapa de origen patrimonial para justificar fondos, transferencias, ingresos, ventas, staking y airdrops.",
    primaryQuestion: "¿De dónde provienen los fondos que quieres respaldar?",
    examples: ["Fondos desde sueldo", "Ahorros bancarios", "Ganancias de trading", "Ingresos por staking"],
    status: "EMPTY",
  },
  {
    key: "taxObligations",
    label: "Obligaciones Tributarias",
    href: "/obligaciones-tributarias",
    description: "Identificación de eventos con posible efecto tributario: ventas, swaps, staking, airdrops, DeFi y retiros.",
    primaryQuestion: "¿Qué operación quieres evaluar tributariamente?",
    examples: ["Venta crypto-fiat", "Swap crypto-crypto", "Ganancias por staking", "Airdrop recibido"],
    status: "PARTIAL",
  },
  {
    key: "documentation",
    label: "Documentación",
    href: "/documentacion",
    description: "Repositorio de respaldos: CSV, cartolas bancarias, comprobantes, declaraciones, reportes y wallet proofs.",
    primaryQuestion: "¿Qué documento necesitas agregar o revisar?",
    examples: ["Subir CSV de Binance", "Agregar cartola bancaria", "Guardar comprobante", "Respaldar wallet"],
    status: "PARTIAL",
  },
];

export function getCryptoFirstModuleByHref(href: string) {
  return cryptoFirstModules.find((item) => item.href === href) ?? null;
}
