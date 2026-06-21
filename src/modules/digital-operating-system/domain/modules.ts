import type { DigitalModuleDefinition } from "./types";

export const cryptoFirstModules: DigitalModuleDefinition[] = [
  {
    key: "sourceOfFunds",
    label: "Origen de Fondos",
    href: "/origen-fondos",
    description: "Trazabilidad integrada de bancos, exchanges, wallets y documentación probatoria del origen patrimonial.",
    primaryQuestion: "¿De dónde provienen los fondos y qué respaldo tienes?",
    examples: ["Fondos desde banco", "Movimientos desde exchange", "Fondos enviados a wallet", "Cartola y comprobante disponibles"],
    status: "EMPTY",
  },
  {
    key: "cryptoAssets",
    label: "Activos",
    href: "/cryptoactivos",
    description: "Registro de criptoactivos, stablecoins y NFTs vinculados al origen de fondos y su evidencia.",
    primaryQuestion: "¿Qué activo digital necesitas ordenar?",
    examples: ["Tengo BTC", "Recibí USDT", "Compré ETH", "Tengo NFTs"],
    status: "PARTIAL",
  },
  {
    key: "documentation",
    label: "Documentación",
    href: "/documentacion",
    description: "Evidencia vinculada al origen de fondos, activos, exchanges y wallets dentro de Mi Patrimonio.",
    primaryQuestion: "¿Qué respaldo necesitas vincular?",
    examples: ["Subir cartola", "Agregar comprobante", "Vincular contrato", "Adjuntar informe tributario"],
    status: "PARTIAL",
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
];

export function getCryptoFirstModuleByHref(href: string) {
  return cryptoFirstModules.find((item) => item.href === href) ?? null;
}
