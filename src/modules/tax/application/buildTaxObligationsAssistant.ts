// src/modules/tax/application/buildTaxObligationsAssistant.ts
// Guía determinística para explicar Obligaciones Tributarias a usuarios básicos.
// No calcula impuestos finales: traduce estados y eventos a instrucciones simples.

export type TaxAssistantEvent = {
  eventType: string;
  symbol: string;
  effectiveTaxCategory: string | null;
  realizedPnlClp?: number | null;
  proceedsGrossClp?: number | null;
  costBasisClp?: number | null;
  executedAt?: Date | string | null;
};

export type TaxAssistantHealth = {
  status: "OK" | "REVIEW" | "RISK";
  score: number;
  issues: Array<{ type: string; count: number; message: string }>;
} | null;

export type TaxObligationsAssistant = {
  title: string;
  summary: string;
  whatIsThis: string;
  whyItMatters: string;
  howToOperate: string[];
  fullFlow: string[];
  nextBestAction: string;
  safeDisclaimer: string;
};

const BASIC_FLOW = [
  "Carga información en Origen de Fondos.",
  "Revisa y corrige tus movimientos en Activos.",
  "LEDGERA detecta operaciones con posible efecto tributario.",
  "Tú confirmas, corriges o agregas respaldo.",
  "Solo después se envía al motor de cálculo tributario.",
];

const BASIC_OPERATION_STEPS = [
  "Mira si hay eventos detectados.",
  "Abre los que aparezcan como pendientes o sin respaldo.",
  "Confirma si la operación es correcta.",
  "Adjunta o valida el documento que la respalda.",
  "Cuando todo esté claro, déjalo listo para cálculo.",
];

function isPending(event: TaxAssistantEvent) {
  const category = String(event.effectiveTaxCategory ?? "").trim();
  return category === "" || category === "PENDING" || category === "UNCLASSIFIED" || category === "SIN_CLASIFICAR";
}

function formatCount(count: number, singular: string, plural: string) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function buildTaxObligationsAssistant(params: {
  events: TaxAssistantEvent[];
  totalEvents: number;
  pendingCount: number;
  taxHealth: TaxAssistantHealth;
}): TaxObligationsAssistant {
  const { events, totalEvents, pendingCount, taxHealth } = params;
  const hasEvents = events.length > 0 || totalEvents > 0;
  const reviewCount = pendingCount || events.filter(isPending).length;
  const hasRisk = taxHealth?.status === "RISK";

  if (!hasEvents) {
    return {
      title: "Todavía no hay nada que revisar aquí",
      summary: "Obligaciones Tributarias se llenará automáticamente cuando Activos tenga movimientos clasificados.",
      whatIsThis: "Esta pantalla sirve para mostrar operaciones que podrían importar para impuestos. No tienes que escribir nada ni saber de impuestos para empezar.",
      whyItMatters: "Algunas operaciones, como ventas, intercambios, rendimientos o movimientos sin respaldo, pueden necesitar revisión antes de un cálculo tributario.",
      howToOperate: BASIC_OPERATION_STEPS,
      fullFlow: BASIC_FLOW,
      nextBestAction: "Primero carga información en Origen de Fondos y luego revisa Activos.",
      safeDisclaimer: "LEDGERA marca posibles efectos tributarios para revisión. El cálculo definitivo debe validarse con la información completa.",
    };
  }

  if (hasRisk) {
    return {
      title: "Hay operaciones que necesitan atención",
      summary: `LEDGERA encontró ${formatCount(totalEvents, "evento tributario", "eventos tributarios")}. Algunos pueden tener errores, faltar respaldo o requerir clasificación.`,
      whatIsThis: "Esta pantalla separa las operaciones que podrían afectar impuestos para que no tengas que revisar todo el historial completo.",
      whyItMatters: "Si una operación está mal clasificada o no tiene respaldo, el cálculo tributario puede quedar incompleto o incorrecto.",
      howToOperate: BASIC_OPERATION_STEPS,
      fullFlow: BASIC_FLOW,
      nextBestAction: "Revisa primero los eventos marcados como pendientes, sin respaldo o con alerta.",
      safeDisclaimer: "Esto no es una declaración final. Es una revisión previa para ordenar los datos antes del cálculo.",
    };
  }

  if (reviewCount > 0) {
    return {
      title: "Hay eventos por revisar",
      summary: `LEDGERA detectó ${formatCount(totalEvents, "evento tributario", "eventos tributarios")}; ${formatCount(reviewCount, "requiere", "requieren")} confirmación del usuario.`,
      whatIsThis: "Aquí ves solo las operaciones que podrían tener efecto tributario, no todos tus movimientos.",
      whyItMatters: "Antes de calcular, debes confirmar si cada evento representa una venta, intercambio, rendimiento, transferencia propia u otro tipo de movimiento.",
      howToOperate: BASIC_OPERATION_STEPS,
      fullFlow: BASIC_FLOW,
      nextBestAction: "Parte revisando los eventos pendientes y confirma si la información es correcta.",
      safeDisclaimer: "LEDGERA ayuda a clasificar y explicar. La decisión final se toma con los datos validados.",
    };
  }

  return {
    title: "Tus eventos están listos para revisión final",
    summary: `LEDGERA detectó ${formatCount(totalEvents, "evento tributario", "eventos tributarios")} sin pendientes visibles.`,
    whatIsThis: "Esta pantalla resume las operaciones relevantes para impuestos a partir de lo revisado en Activos.",
    whyItMatters: "Sirve para verificar que los eventos estén claros antes de enviarlos al motor de cálculo tributario.",
    howToOperate: BASIC_OPERATION_STEPS,
    fullFlow: BASIC_FLOW,
    nextBestAction: "Revisa el resumen y confirma que los eventos tienen respaldo suficiente.",
    safeDisclaimer: "La pantalla prepara la información para cálculo, pero no reemplaza revisión profesional cuando corresponda.",
  };
}
