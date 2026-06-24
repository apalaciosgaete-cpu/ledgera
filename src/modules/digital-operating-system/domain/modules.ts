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
    description: "Vista consolidada para revisar transacciones, saldos, activos detectados y datos pendientes.",
    primaryQuestion: "Revisa tus movimientos antes del análisis tributario",
    examples: ["Ver transacciones", "Revisar pendientes", "Activos detectados", "Eventos tributarios"],
    status: "PARTIAL",
  },
  {
    key: "taxObligations",
    label: "Obligaciones Tributarias",
    href: "/obligaciones-tributarias",
    description: "Operaciones detectadas desde Activos que podrían requerir revisión, respaldo o cálculo tributario.",
    primaryQuestion: "LEDGERA te explica qué revisar y por qué",
    examples: ["Qué debo revisar", "Por qué importa", "Qué falta respaldar", "Qué está listo para cálculo"],
    status: "PARTIAL",
  },
];

export function getCryptoFirstModuleByHref(href: string) {
  return cryptoFirstModules.find((item) => item.href === href) ?? null;
}
