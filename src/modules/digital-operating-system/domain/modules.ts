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
    description: "Identificación de eventos con posible efecto tributario y nivel de revisión requerido.",
    primaryQuestion: "Eventos tributarios detectados desde Activos",
    examples: ["Eventos por revisar", "Eventos con respaldo", "Listos para cálculo", "Sin clasificar"],
    status: "PARTIAL",
  },
];

export function getCryptoFirstModuleByHref(href: string) {
  return cryptoFirstModules.find((item) => item.href === href) ?? null;
}
