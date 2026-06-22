/**
 * AI Context Builder
 * Responsable de recolectar toda la información del usuario para la IA.
 */
export interface AIContext {
  userId: string;
  riskScore?: number;
  smartScore?: number;
}

export async function buildAIContext(userId: string): Promise<AIContext> {
  return {
    userId,
  };
}