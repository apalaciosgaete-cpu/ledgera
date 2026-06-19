import type { DigitalModuleDefinition } from "./types";

export const cryptoFirstModules: DigitalModuleDefinition[] = [
  {
    key: "digitalWealth",
    label: "Patrimonio Digital",
    href: "/patrimonio-digital",
    description: "Vista consolidada del patrimonio digital y su estado general de revisión.",
    primaryQuestion: "Cuéntame qué patrimonio digital necesitas ordenar.",
    examples: ["Tengo BTC y USDT", "Quiero ordenar mi patrimonio digital", "Necesito revisar mis activos", "Tengo fondos en distintos lugares"],
    status: "PARTIAL",
  },
  {
    key: "cryptoAssets",
    label: "Cryptoactivos",
    href: "/cryptoactivos",
    description: "Detalle de activos digitales, posiciones, resultados estimados y eventos relevantes.",
    primaryQuestion: "¿Qué cryptoactivo u operación necesitas revisar?",
    examples: ["Vendí Bitcoin", "Tengo ETH en staking", "Recibí USDT", "Compré SOL"],
    status: "PARTIAL",
  },
  {
    key: "sourceOfFunds",
    label: "Origen de Fondos",
    href: "/origen-fondos",
    description: "Trazabilidad integrada de bancos, exchanges, wallets, transferencias y respaldo patrimonial.",
    primaryQuestion: "¿De dónde provienen los fondos y por dónde se movieron?",
    examples: ["Fondos desde banco", "Movimientos entre exchange y wallet", "Ahorros bancarios", "Ingresos por staking"],
    status: "EMPTY",
  },
  {
    key: "taxObligations",
    label: "Obligaciones Tributarias",
    href: "/obligaciones-tributarias",
    description: "Identificación de eventos con posible efecto tributario y nivel de revisión requerido.",
    primaryQuestion: "¿Qué operación quieres evaluar tributariamente?",
    examples: ["Venta crypto-fiat", "Intercambio entre activos", "Rendimiento por staking", "Airdrop recibido"],
    status: "PARTIAL",
  },
  {
    key: "documentation",
    label: "Documentación",
    href: "/documentacion",
    description: "Repositorio de respaldos para patrimonio digital, origen de fondos y obligaciones tributarias.",
    primaryQuestion: "¿Qué documento necesitas agregar o revisar?",
    examples: ["Subir CSV de exchange", "Agregar cartola bancaria", "Guardar comprobante", "Respaldar wallet"],
    status: "PARTIAL",
  },
];

export function getCryptoFirstModuleByHref(href: string) {
  return cryptoFirstModules.find((item) => item.href === href) ?? null;
}
