import { calculateTaxRiskScore } from "@/modules/risk/application/calculateTaxRiskScore";
import { generateRecommendations } from "@/modules/recommendations/application/generateRecommendations";
import { generateAutomationProposals } from "@/modules/automation/application/generateAutomationProposals";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { saveOrchestrationRun } from "@/modules/ai-orchestrator/infrastructure/orchestrationRepository";
import type { OrchestrationResult } from "@/modules/ai-orchestrator/domain/orchestration";

export async function runAIOrchestration(userId: string): Promise<OrchestrationResult> {
  const errors: string[] = [];
  let riskUpdated = false;
  let recommendationsCreated = 0;
  let automationsCreated = 0;

  await recordAuditEvent({
    userId,
    actorId: userId,
    category: "AI",
    severity: "INFO",
    event: "ai_orchestration_started",
    description: "Orquestación AI iniciada.",
    result: "SUCCESS",
    entityType: "AIOrchestrationRun",
  });

  try {
    await calculateTaxRiskScore(userId);
    riskUpdated = true;
  } catch (error) {
    errors.push("risk");
    console.error("[ai-orchestrator/risk]", error);
  }

  try {
    const result = await generateRecommendations(userId);
    if (result.ok) recommendationsCreated = result.created;
    else errors.push("recommendations");
  } catch (error) {
    errors.push("recommendations");
    console.error("[ai-orchestrator/recommendations]", error);
  }

  try {
    const result = await generateAutomationProposals(userId);
    if (result.ok) automationsCreated = result.created;
    else errors.push("automations");
  } catch (error) {
    errors.push("automations");
    console.error("[ai-orchestrator/automations]", error);
  }

  const totalSteps = 3;
  const failedSteps = errors.length;
  const status = failedSteps === 0 ? "SUCCESS" : failedSteps === totalSteps ? "FAILED" : "PARTIAL";

  const run = await saveOrchestrationRun({
    userId,
    status,
    riskUpdated,
    recommendationsCreated,
    automationsCreated,
    errors,
  });

  await recordAuditEvent({
    userId,
    actorId: userId,
    category: "AI",
    severity: status === "FAILED" ? "ERROR" : status === "PARTIAL" ? "WARNING" : "INFO",
    event: status === "FAILED" ? "ai_orchestration_failed" : "ai_orchestration_completed",
    description: "Orquestación AI finalizada.",
    result: status,
    entityType: "AIOrchestrationRun",
    entityId: run.id,
    metadata: { riskUpdated, recommendationsCreated, automationsCreated, errors },
  });

  return run;
}
