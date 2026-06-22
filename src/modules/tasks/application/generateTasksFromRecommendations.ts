import { listUserRecommendations } from "@/modules/recommendations/infrastructure/recommendationRepository";
import {
  createTask,
  findActiveTaskBySource,
} from "@/modules/tasks/infrastructure/taskRepository";
import type { Recommendation, RecommendationPriority } from "@/modules/recommendations/domain/recommendation";
import type { TaskCategory, TaskPriority, TaskSource } from "@/modules/tasks/domain/task";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export type GenerateTasksFromRecommendationsResult =
  | { ok: true; created: number }
  | { ok: false; message: string };

interface TaskTemplate {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  source: TaskSource;
}

export async function generateTasksFromRecommendations(
  userId: string,
): Promise<GenerateTasksFromRecommendationsResult> {
  try {
    const recommendations = await listUserRecommendations(userId, { status: "ACTIVE" });
    let created = 0;

    for (const recommendation of recommendations) {
      const template = mapRecommendationToTask(recommendation);
      if (!template) continue;

      const existing = await findActiveTaskBySource(
        userId,
        template.source,
        recommendation.sourceId,
      );

      if (existing) continue;

      const task = await createTask({
        userId,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority,
        source: template.source,
        sourceId: recommendation.sourceId,
        dueDate: calculateDueDate(template.priority),
        metadata: {
          recommendationId: recommendation.id,
          recommendationSourceType: recommendation.sourceType,
          actionUrl: recommendation.actionUrl,
        },
      });

      await recordAuditEvent({
        userId,
        actorId: userId,
        category: "COMPLIANCE",
        severity: mapPriorityToSeverity(template.priority),
        event: "task_created",
        description: `Tarea generada automáticamente: ${task.title}`,
        result: "SUCCESS",
        entityType: "Task",
        entityId: task.id,
        metadata: {
          category: task.category,
          priority: task.priority,
          source: task.source,
          sourceId: task.sourceId,
          recommendationId: recommendation.id,
        },
      });

      created++;
    }

    return { ok: true, created };
  } catch (error) {
    console.error("[tasks/generateTasksFromRecommendations]", error);
    return { ok: false, message: "Error al generar tareas." };
  }
}

function mapRecommendationToTask(recommendation: Recommendation): TaskTemplate | null {
  switch (recommendation.sourceType) {
    case "TAX_PROFILE_INCOMPLETE":
      return {
        title: "Completar identidad tributaria",
        description: recommendation.description,
        category: "COMPLIANCE",
        priority: "HIGH",
        source: "RECOMMENDATION",
      };
    case "TAX_DOCUMENT_REJECTED":
      return {
        title: "Revisar documento rechazado",
        description: recommendation.description,
        category: "TRIBUTARY",
        priority: "CRITICAL",
        source: "DTE",
      };
    case "SMART_TAX_SCORE":
      return {
        title: "Mejorar score tributario",
        description: recommendation.description,
        category: "TRIBUTARY",
        priority: "HIGH",
        source: "RECOMMENDATION",
      };
    case "EXCHANGE_CONNECTION_INACTIVE":
      return {
        title: `Reconectar ${recommendation.metadata?.exchange ?? "exchange"}`,
        description: recommendation.description,
        category: "CONNECTIONS",
        priority: "MEDIUM",
        source: "RECOMMENDATION",
      };
    case "SII_CERTIFICATE_EXPIRED":
      return {
        title: "Renovar certificado",
        description: recommendation.description,
        category: "COMPLIANCE",
        priority: "CRITICAL",
        source: "SII",
      };
    default:
      return {
        title: recommendation.title,
        description: recommendation.description,
        category: mapCategory(recommendation.category),
        priority: mapPriority(recommendation.priority),
        source: "RECOMMENDATION",
      };
  }
}

function mapCategory(
  category: Recommendation["category"],
): TaskCategory {
  switch (category) {
    case "TRIBUTARY":
      return "TRIBUTARY";
    case "COMPLIANCE":
      return "COMPLIANCE";
    case "OPERATIONS":
      return "OPERATIONS";
    case "CONNECTIONS":
      return "CONNECTIONS";
    case "BILLING":
      return "BILLING";
    case "RISK":
      return "SECURITY";
    default:
      return "COMPLIANCE";
  }
}

function mapPriority(priority: RecommendationPriority): TaskPriority {
  switch (priority) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MEDIUM";
    case "LOW":
    default:
      return "LOW";
  }
}

function calculateDueDate(priority: TaskPriority): Date {
  const now = new Date();
  const days =
    priority === "CRITICAL" ? 1 : priority === "HIGH" ? 3 : priority === "MEDIUM" ? 7 : 14;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function mapPriorityToSeverity(
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
  switch (priority) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "ERROR";
    case "MEDIUM":
      return "WARNING";
    case "LOW":
    default:
      return "INFO";
  }
}
