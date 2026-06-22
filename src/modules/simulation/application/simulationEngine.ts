import { clampScore, type SimulationInput, type SimulationResult } from "@/modules/simulation/domain/simulation";

export function runSimulationEngine(input: SimulationInput, currentRisk: number, currentScore: number): SimulationResult {
  switch (input.scenarioType) {
    case "INCOME": {
      const increasePercentage = Number(input.payload.increasePercentage ?? 10);
      const projectedRisk = clampScore(currentRisk - Math.min(10, increasePercentage / 5));
      const projectedScore = clampScore(currentScore + Math.min(12, increasePercentage / 4));
      return {
        summary: `Si tus ingresos aumentan ${increasePercentage}%, tu score podría mejorar si mantienes tus documentos al día.`,
        impact: { currentRisk, projectedRisk, currentScore, projectedScore, taxImpact: Math.round(increasePercentage * 0.19) },
        recommendations: ["Revisar flujo de caja", "Mantener DTE y declaraciones al día", "Monitorear pagos provisionales"],
      };
    }
    case "INVESTMENT": {
      return {
        summary: "Una inversión puede mejorar planificación si está respaldada y bien documentada.",
        impact: { currentRisk, projectedRisk: clampScore(currentRisk - 3), currentScore, projectedScore: clampScore(currentScore + 4), taxImpact: -5 },
        recommendations: ["Guardar respaldos", "Clasificar la inversión", "Evaluar beneficio tributario"],
      };
    }
    case "COMPLIANCE": {
      const regularize = Boolean(input.payload.regularize ?? true);
      return regularize
        ? {
            summary: "Regularizar documentos pendientes puede reducir riesgo y mejorar tu score.",
            impact: { currentRisk, projectedRisk: clampScore(currentRisk - 15), currentScore, projectedScore: clampScore(currentScore + 10), taxImpact: 0 },
            recommendations: ["Corregir documentos rechazados", "Cerrar tareas pendientes", "Actualizar memoria tributaria"],
          }
        : {
            summary: "Atrasar cumplimiento puede aumentar el riesgo y bajar tu score.",
            impact: { currentRisk, projectedRisk: clampScore(currentRisk + 20), currentScore, projectedScore: clampScore(currentScore - 15), taxImpact: 10 },
            recommendations: ["Evitar atrasos", "Priorizar declaraciones", "Crear tarea de seguimiento"],
          };
    }
    case "CUSTOM":
    default:
      return {
        summary: "Escenario personalizado estimado con reglas generales.",
        impact: { currentRisk, projectedRisk: clampScore(currentRisk), currentScore, projectedScore: clampScore(currentScore), taxImpact: 0 },
        recommendations: ["Revisar con un experto", "Guardar evidencia", "Simular escenarios alternativos"],
      };
  }
}
