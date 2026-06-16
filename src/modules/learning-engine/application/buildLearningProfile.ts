import { prisma } from "@/lib/prisma";
import { percentage, resolveTrend, type LearningProfile } from "@/modules/learning-engine/domain/learning";
import { listUserLearningEvents } from "@/modules/learning-engine/infrastructure/learningRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";

export async function buildLearningProfile(userId: string): Promise<{ ok: true; profile: LearningProfile } | { ok: false; message: string }> {
  try {
    const [events, scores, risks] = await Promise.all([
      listUserLearningEvents(userId, 500),
      prisma.smartTaxScore.findMany({ where: { userId }, orderBy: { evaluatedAt: "desc" }, take: 2 }),
      prisma.taxRiskScore.findMany({ where: { userId }, orderBy: { evaluatedAt: "desc" }, take: 2 }),
    ]);

    const recommendationCompleted = events.filter((event) => event.eventType === "RECOMMENDATION_COMPLETED").length;
    const recommendationDismissed = events.filter((event) => event.eventType === "RECOMMENDATION_DISMISSED").length;
    const automationApproved = events.filter((event) => event.eventType === "AUTOMATION_APPROVED").length;
    const automationRejected = events.filter((event) => event.eventType === "AUTOMATION_REJECTED").length;
    const taskCompleted = events.filter((event) => event.eventType === "TASK_COMPLETED").length;
    const taskCreated = events.filter((event) => event.eventType === "TASK_CREATED").length;

    const scoreDelta = scores.length >= 2 ? scores[0].score - scores[1].score : 0;
    const riskDelta = risks.length >= 2 ? risks[1].score - risks[0].score : 0;

    const profile: LearningProfile = {
      userId,
      recommendationAcceptanceRate: percentage(recommendationCompleted, recommendationCompleted + recommendationDismissed),
      automationAcceptanceRate: percentage(automationApproved, automationApproved + automationRejected),
      taskCompletionRate: percentage(taskCompleted, taskCreated || taskCompleted),
      scoreTrend: resolveTrend(scoreDelta),
      riskTrend: resolveTrend(riskDelta),
      totalEvents: events.length,
      generatedAt: new Date(),
    };

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "AI",
      severity: "INFO",
      event: "learning_profile_generated",
      description: "Perfil de aprendizaje tributario generado.",
      result: "SUCCESS",
      entityType: "LearningProfile",
      metadata: profile,
    });

    return { ok: true, profile };
  } catch (error) {
    console.error("[learning-engine/buildLearningProfile]", error);
    return { ok: false, message: "No se pudo generar el perfil de aprendizaje." };
  }
}
