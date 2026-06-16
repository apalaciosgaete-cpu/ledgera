import { getDocumentMetrics as getDocumentMetricsRepo } from "@/modules/documents/infrastructure/documentRepository";

export type DocumentMetricsResult =
  | { ok: true; metrics: { total: number; tax: number; pendingReview: number; last30Days: number } }
  | { ok: false; message: string };

export async function getDocumentMetrics(userId: string): Promise<DocumentMetricsResult> {
  try {
    const metrics = await getDocumentMetricsRepo(userId);
    return { ok: true, metrics };
  } catch (error) {
    console.error("[documents/getDocumentMetrics]", error);
    return { ok: false, message: "Error al obtener métricas de documentos." };
  }
}
