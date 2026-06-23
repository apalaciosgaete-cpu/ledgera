import type { DigitalModuleDefinition } from "./types";

export const cryptoFirstModules: DigitalModuleDefinition[] = [
  {
    key: "sourceOfFunds",
    label: "Origen de Fondos",
    href: "/origen-fondos",
    description: "Trazabilidad integrada de bancos, exchanges, wallets y carga de documentación PDF o Excel.",
    primaryQuestion: "¿De dónde provienen los fondos y qué archivo tienes para respaldarlo?",
    examples: ["Fondos desde banco", "Movimientos desde exchange", "Fondos enviados a wallet", "Tengo PDF o Excel de respaldo"],
    status: "EMPTY",
  },
  {
    key: "cryptoAssets",
    label: "Activos",
    href: "/cryptoactivos",
    description: "Registro de criptoactivos, NFTs, wallets frías y exchanges asociados al patrimonio digital.",
    primaryQuestion: "¿Qué activo o custodia necesitas ordenar?",
    examples: ["Tengo BTC", "Tengo NFTs", "Uso wallet fría", "Tengo activos en exchange"],
    status: "PARTIAL",
  },
  {
    key: "taxObligations",
    label: "Obligaciones Tributarias",
    href: "/obligaciones-tributarias",
    description: "Convierte tus movimientos financieros en obligaciones claras y trazables.",
    primaryQuestion: "¿Qué operación quieres evaluar tributariamente?",
    examples: ["Venta crypto-fiat", "Intercambio entre activos", "Rendimiento por staking", "Airdrop recibido"],
    status: "PARTIAL",
  },
];

export function getCryptoFirstModuleByHref(href: string) {
  return cryptoFirstModules.find((item) => item.href === href) ?? null;
}
