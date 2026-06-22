import { buildAIContext, type AIContext } from "./aiContextBuilder";

/**
 * AI Reasoning Engine
 * Transforma Datos + Reglas + Contexto en Insights accionables.
 */
export async function explainRisk(userId: string): Promise<string> {
  const context: AIContext = await buildAIContext(userId);

  // Lógica mínima para desbloquear
  return `Análisis de riesgo generado para el usuario ${context.userId}`;
}
