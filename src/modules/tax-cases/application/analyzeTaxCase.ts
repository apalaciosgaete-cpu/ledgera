import type { TaxCase, TaxCasePriority, TaxCaseStatus } from "@/modules/tax-cases/domain/taxCase";

export interface TaxCaseAnalysis {
  summary: string;
  risk: "BAJO" | "MEDIO" | "ALTO" | "CRITICO";
  impact: string;
  nextSteps: string[];
}

const ANALYSIS_TEMPLATES: Record<string, (description: string) => TaxCaseAnalysis> = {
  "RIESGO_CRITICO": (desc) => ({
    summary: `LEDGERA detectó un riesgo tributario crítico. ${desc}`,
    risk: "CRITICO",
    impact: "Puede resultar en multas SII, fiscalización inmediata o pérdida de beneficios tributarios.",
    nextSteps: [
      "Revisar el expediente tributario completo",
      "Identificar las causas del riesgo crítico",
      "Programar una revisión con un contador o asesor tributario",
      "Aplicar las correcciones recomendadas dentro de las próximas 48 horas",
    ],
  }),
  "DOCUMENTACION_RECHAZADA": (desc) => ({
    summary: `LEDGERA detectó documentos tributarios rechazados. ${desc}`,
    risk: "ALTO",
    impact: "Puede impedir declaraciones futuras y generar observaciones del SII.",
    nextSteps: [
      "Corregir documentos pendientes durante las próximas 48 horas",
      "Verificar los motivos del rechazo en cada documento",
      "Reenviar los documentos corregidos al SII",
      "Confirmar la aceptación de los documentos reenviados",
    ],
  }),
  "FISCALIZACION": (desc) => ({
    summary: `LEDGERA identificó una fiscalización del SII en curso o inminente. ${desc}`,
    risk: "CRITICO",
    impact: "Fiscalización activa que requiere respuesta oportuna y documentación completa.",
    nextSteps: [
      "Reunir todos los antecedentes solicitados por el SII",
      "Verificar la integridad de la documentación tributaria",
      "Designar un responsable para la coordinación con el SII",
      "Establecer un plan de respuesta con plazos definidos",
    ],
  }),
  "INCONSISTENCIA_DTE": (desc) => ({
    summary: `LEDGERA encontró inconsistencias en Documentos Tributarios Electrónicos. ${desc}`,
    risk: "ALTO",
    impact: "Las inconsistencias DTE pueden generar reparos del SII y afectar la contabilidad.",
    nextSteps: [
      "Revisar los DTE con inconsistencias detectadas",
      "Corregir o reemplazar los documentos inconsistentes",
      "Validar que los montos e IVA sean correctos",
      "Conciliar con los registros contables internos",
    ],
  }),
  "IVA_PENDIENTE": (desc) => ({
    summary: `LEDGERA detectó IVA pendiente de declaración o pago. ${desc}`,
    risk: "ALTO",
    impact: "El IVA no declarado genera intereses, reajustes y posibles multas del SII.",
    nextSteps: [
      "Calcular el IVA correspondiente al período",
      "Preparar y presentar la declaración de IVA",
      "Programar el pago antes de la fecha de vencimiento",
      "Registrar la declaración y pago en el sistema contable",
    ],
  }),
  "REQUERIMIENTO_SII": (desc) => ({
    summary: `LEDGERA registró un requerimiento de antecedentes del SII. ${desc}`,
    risk: "ALTO",
    impact: "El SII solicita antecedentes específicos. La falta de respuesta puede derivar en sanciones.",
    nextSteps: [
      "Identificar los antecedentes solicitados por el SII",
      "Recopilar la documentación requerida",
      "Preparar una respuesta formal y completa",
      "Enviar la respuesta dentro del plazo otorgado",
      "Hacer seguimiento hasta la confirmación de recepción",
    ],
  }),
  "AHORRO_TRIBUTARIO": (desc) => ({
    summary: `LEDGERA identificó un plan de ahorro tributario. ${desc}`,
    risk: "BAJO",
    impact: "Oportunidad de optimización tributaria que puede generar ahorros significativos.",
    nextSteps: [
      "Revisar las recomendaciones de ahorro tributario",
      "Evaluar la viabilidad de cada recomendación",
      "Consultar con un asesor tributario si es necesario",
      "Implementar las acciones de ahorro seleccionadas",
    ],
  }),
  "OBSERVACION_F22": (desc) => ({
    summary: `LEDGERA detectó una observación en el Formulario 22. ${desc}`,
    risk: "MEDIO",
    impact: "Observación del SII sobre la declaración de renta que requiere aclaración.",
    nextSteps: [
      "Revisar la observación del Formulario 22",
      "Identificar las discrepancias señaladas por el SII",
      "Preparar los antecedentes que respalden la declaración",
      "Responder formalmente la observación dentro del plazo",
    ],
  }),
};

export function analyzeTaxCase(sourceType: string, description: string): TaxCaseAnalysis {
  const template = ANALYSIS_TEMPLATES[sourceType];
  if (template) {
    return template(description);
  }

  // Generic analysis for custom cases
  return {
    summary: `LEDGERA ha creado un caso tributario personalizado. ${description}`,
    risk: "MEDIO",
    impact: "Requiere revisión para determinar el impacto tributario específico.",
    nextSteps: [
      "Revisar los detalles del caso",
      "Identificar las acciones necesarias",
      "Establecer un plan de trabajo",
      "Hacer seguimiento periódico del avance",
    ],
  };
}

export function determineInitialStatus(priority: TaxCasePriority): TaxCaseStatus {
  switch (priority) {
    case "CRITICAL":
      return "ACTION_REQUIRED";
    case "HIGH":
      return "OPEN";
    case "MEDIUM":
      return "OPEN";
    case "LOW":
      return "OPEN";
  }
}
