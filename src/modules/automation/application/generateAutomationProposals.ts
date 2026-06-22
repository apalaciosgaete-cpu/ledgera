import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { createProposal, findActiveProposalBySource } from "@/modules/automation/infrastructure/automationRepository";
import type { AutomationPriority, AutomationProposal, AutomationType } from "@/modules/automation/domain/automation";

export type GenerateAutomationProposalsResult =
  | { ok: true; created: number; proposals: AutomationProposal[] }
  | { ok: false; message: string };

type Signal = {
  type: AutomationType;
  priority: AutomationPriority;
  title: string;
  description: string;
  sourceEntity: string;
  sourceEntityId: string;
  metadata?: Record<string, unknown>;
};

export async function generateAutomationProposals(userId: string): Promise<GenerateAutomationProposalsResult> {
  try {
    const signals = await collectSignals(userId);
    const proposals: AutomationProposal[] = [];

    for (const signal of signals) {
      const existing = await findActiveProposalBySource(userId, signal.type, signal.sourceEntity, signal.sourceEntityId);
      if (existing) continue;

      const proposal = await createProposal({
        userId,
        type: signal.type,
        priority: signal.priority,
        title: signal.title,
        description: signal.description,
        sourceEntity: signal.sourceEntity,
        sourceEntityId: signal.sourceEntityId,
        metadata: signal.metadata ?? null,
      });

      proposals.push(proposal);
      await recordAuditEvent({
        userId,
        actorId: userId,
        category: "AI",
        severity: mapPriorityToSeverity(signal.priority),
        event: "automation_proposed",
        description: signal.title,
        result: "SUCCESS",
        entityType: "AutomationProposal",
        entityId: proposal.id,
        metadata: { type: signal.type, sourceEntity: signal.sourceEntity, sourceEntityId: signal.sourceEntityId },
      });
    }

    return { ok: true, created: proposals.length, proposals };
  } catch (error) {
    console.error("[automation/generateAutomationProposals]", error);
    return { ok: false, message: "No se pudieron reevaluar las automatizaciones." };
  }
}

async function collectSignals(userId: string): Promise<Signal[]> {
  const [riskRows, rejectedDte, openTasks] = await Promise.all([
    prisma.taxRiskScore.findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } }),
    prisma.taxDocument.count({ where: { userId, status: "REJECTED" } }),
    prisma.task.count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
  ]);

  const signals: Signal[] = [];

  if (riskRows && ["HIGH", "CRITICAL"].includes(riskRows.level)) {
    signals.push({
      type: "CREATE_TASK",
      priority: riskRows.level === "CRITICAL" ? "CRITICAL" : "HIGH",
      title: "Crear tarea de revisión tributaria",
      description: "LEDGERA detectó señales de riesgo y puede crear una tarea para revisar los puntos pendientes.",
      sourceEntity: "TaxRiskScore",
      sourceEntityId: riskRows.id,
      metadata: { level: riskRows.level, score: riskRows.score },
    });
  }

  if (rejectedDte > 0) {
    signals.push({
      type: "CREATE_TASK",
      priority: "CRITICAL",
      title: "Crear tarea para revisar documentos rechazados",
      description: "Hay documentos rechazados que requieren revisión. LEDGERA puede crear una tarea crítica.",
      sourceEntity: "TaxDocument",
      sourceEntityId: "rejected",
      metadata: { rejectedDte },
    });
  }

  if (openTasks >= 10) {
    signals.push({
      type: "CREATE_FOLLOW_UP",
      priority: "HIGH",
      title: "Crear seguimiento por tareas acumuladas",
      description: "Tienes varias tareas pendientes. LEDGERA puede crear un seguimiento para ordenarlas.",
      sourceEntity: "Task",
      sourceEntityId: "open-tasks",
      metadata: { openTasks },
    });
  }

  return signals;
}

function mapPriorityToSeverity(priority: AutomationPriority): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
  if (priority === "CRITICAL") return "CRITICAL";
  if (priority === "HIGH") return "ERROR";
  if (priority === "MEDIUM") return "WARNING";
  return "INFO";
}
