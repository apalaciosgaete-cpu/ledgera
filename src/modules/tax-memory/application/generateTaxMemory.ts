import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { resolveMemoryStrength } from "@/modules/tax-memory/domain/taxMemory";
import { upsertTaxMemoryPattern } from "@/modules/tax-memory/infrastructure/taxMemoryRepository";

export type GenerateTaxMemoryResult =
  | { ok: true; patterns: number }
  | { ok: false; message: string };

export async function generateTaxMemory(userId: string): Promise<GenerateTaxMemoryResult> {
  try {
    const [criticalAlerts, pendingTasks, rejectedDocuments, recommendations] = await Promise.all([
      prisma.alert.count({ where: { userId, status: { not: "RESOLVED" }, severity: "CRITICAL" } }),
      prisma.task.count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
      prisma.taxDocument.count({ where: { userId, status: "REJECTED" } }),
      prisma.recommendation.count({ where: { userId, status: "ACTIVE" } }),
    ]);

    let patterns = 0;

    if (criticalAlerts > 0) {
      await upsertTaxMemoryPattern({
        userId,
        category: "RISK",
        title: "Alertas críticas recurrentes",
        description: "LEDGERA detectó que existen alertas críticas que se repiten o siguen abiertas.",
        strength: resolveMemoryStrength(criticalAlerts),
        occurrenceCount: criticalAlerts,
        metadata: { criticalAlerts },
      });
      patterns++;
    }

    if (pendingTasks >= 5) {
      await upsertTaxMemoryPattern({
        userId,
        category: "TASK",
        title: "Acumulación de tareas pendientes",
        description: "El usuario tiende a acumular tareas pendientes antes de resolverlas.",
        strength: resolveMemoryStrength(pendingTasks),
        occurrenceCount: pendingTasks,
        metadata: { pendingTasks },
      });
      patterns++;
    }

    if (rejectedDocuments > 0) {
      await upsertTaxMemoryPattern({
        userId,
        category: "DOCUMENT",
        title: "Documentos rechazados",
        description: "Se observa presencia de documentos tributarios rechazados que requieren revisión.",
        strength: resolveMemoryStrength(rejectedDocuments),
        occurrenceCount: rejectedDocuments,
        metadata: { rejectedDocuments },
      });
      patterns++;
    }

    if (recommendations >= 3) {
      await upsertTaxMemoryPattern({
        userId,
        category: "RECOMMENDATION",
        title: "Recomendaciones pendientes recurrentes",
        description: "LEDGERA detectó varias recomendaciones activas sin cerrar.",
        strength: resolveMemoryStrength(recommendations),
        occurrenceCount: recommendations,
        metadata: { recommendations },
      });
      patterns++;
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "AI",
      severity: "INFO",
      event: "tax_memory_generated",
      description: "Memoria tributaria actualizada.",
      result: "SUCCESS",
      entityType: "TaxMemoryPattern",
      metadata: { patterns },
    });

    return { ok: true, patterns };
  } catch (error) {
    console.error("[tax-memory/generateTaxMemory]", error);
    return { ok: false, message: "No se pudo actualizar la memoria tributaria." };
  }
}
