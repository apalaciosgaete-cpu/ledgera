import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import {
  type Workflow,
  type WorkflowActionType,
  type WorkflowStep,
} from "@/modules/workflow-engine/domain/workflow";
import {
  createWorkflow,
  findWorkflowById,
} from "@/modules/workflow-engine/infrastructure/workflowRepository";

interface StepTemplate {
  actionType: WorkflowActionType;
  title: string;
  description: string;
  metadata: Record<string, unknown> | null;
}

const WORKFLOW_TEMPLATES: Record<string, (caseTitle: string, caseDesc: string, aiRec: string) => StepTemplate[]> = {
  RIESGO_CRITICO: (title, desc, rec) => [
    {
      actionType: "NOTIFY_USER",
      title: "Notificar riesgo crítico",
      description: `Informar al usuario sobre el riesgo crítico detectado: ${title}`,
      metadata: { priority: "CRITICAL", source: "workflow" },
    },
    {
      actionType: "CREATE_TASK",
      title: "Revisar expediente tributario",
      description: rec.split("\n")[0] || "Realizar revisión completa del expediente tributario.",
      metadata: { priority: "CRITICAL", category: "RISK", source: "workflow" },
    },
    {
      actionType: "CREATE_REMINDER",
      title: "Recordatorio: programar revisión",
      description: "Programar una revisión con contador o asesor tributario dentro de 48 horas.",
      metadata: { priority: "CRITICAL", dueInHours: 48 },
    },
    {
      actionType: "OPEN_CASE",
      title: "Abrir expediente de riesgo",
      description: "Crear expediente formal para seguimiento del caso de riesgo crítico.",
      metadata: { supervised: true, source: desc },
    },
  ],
  DOCUMENTACION_RECHAZADA: (title, _desc, rec) => [
    {
      actionType: "NOTIFY_USER",
      title: "Notificar documentos rechazados",
      description: `Informar al usuario sobre documentos tributarios rechazados: ${title}`,
      metadata: { priority: "HIGH" },
    },
    {
      actionType: "CREATE_TASK",
      title: "Corregir documentos rechazados",
      description: rec.split("\n")[0] || "Corregir y reenviar los documentos tributarios rechazados.",
      metadata: { priority: "HIGH", category: "DOCUMENTS" },
    },
    {
      actionType: "CREATE_REMINDER",
      title: "Recordatorio de corrección",
      description: "Verificar que los documentos corregidos sean aceptados dentro de las próximas 48 horas.",
      metadata: { dueInHours: 48 },
    },
  ],
  FISCALIZACION: (_title, desc, rec) => [
    {
      actionType: "NOTIFY_USER",
      title: "Notificar fiscalización SII",
      description: "Informar al usuario sobre la fiscalización del SII en curso.",
      metadata: { priority: "CRITICAL" },
    },
    {
      actionType: "CREATE_TASK",
      title: "Reunir antecedentes",
      description: rec.split("\n")[0] || "Reunir todos los antecedentes solicitados por el SII.",
      metadata: { priority: "CRITICAL", category: "SII" },
    },
    {
      actionType: "CREATE_TASK",
      title: "Designar responsable",
      description: rec.split("\n")[1] || "Designar un responsable para coordinación con el SII.",
      metadata: { priority: "HIGH", category: "SII" },
    },
    {
      actionType: "UPDATE_PROFILE",
      title: "Actualizar perfil de fiscalización",
      description: "Registrar el estado de fiscalización en el perfil tributario.",
      metadata: { supervised: true, field: "siiAuditStatus" },
    },
  ],
};

function getTemplate(sourceType: string): ((title: string, desc: string, rec: string) => StepTemplate[]) | null {
  return WORKFLOW_TEMPLATES[sourceType] ?? null;
}

export async function buildWorkflowFromCase(
  caseId: string,
  userId: string,
): Promise<Workflow | null> {
  // Fetch the tax case
  const taxCase = await prisma.taxCase.findFirst({
    where: { id: caseId, userId },
  });

  if (!taxCase) return null;

  // Check if workflow already exists for this case
  const existingWorkflow = await prisma.workflow.findFirst({
    where: { caseId, userId, status: { notIn: ["COMPLETED", "FAILED"] } },
  });

  if (existingWorkflow) {
    return findWorkflowById(existingWorkflow.id);
  }

  const template = getTemplate(taxCase.sourceType);
  const aiRecommendations = taxCase.aiRecommendation || "";

  let steps: StepTemplate[];

  if (template) {
    steps = template(taxCase.title, taxCase.description, aiRecommendations);
  } else {
    // Generic workflow from AI recommendations
    const lines = aiRecommendations
      .split("\n")
      .filter(Boolean)
      .slice(0, 5);

    steps = [
      {
        actionType: "NOTIFY_USER",
        title: "Notificar nuevo caso",
        description: `LEDGERA ha creado un workflow para: ${taxCase.title}`,
        metadata: { priority: "MEDIUM" },
      },
      ...lines.map((line, i) => ({
        actionType: "CREATE_TASK" as WorkflowActionType,
        title: `Paso ${i + 1}: ${line.slice(0, 60)}`,
        description: line,
        metadata: { priority: "MEDIUM", category: "WORKFLOW", step: i + 1 },
      })),
    ];
  }

  // Create workflow with steps
  const workflow = await createWorkflow({
    userId,
    caseId: taxCase.id,
    title: `Workflow: ${taxCase.title}`,
    description: `Workflow autónomo generado a partir del caso "${taxCase.title}".`,
    sourceType: taxCase.sourceType,
    steps: steps.map((s, i) => ({
      stepOrder: i + 1,
      actionType: s.actionType,
      title: s.title,
      description: s.description,
      metadata: s.metadata,
    })),
  });

  await recordAuditEvent({
    userId,
    category: "AI",
    severity: "INFO",
    event: "workflow_created",
    description: `Workflow creado desde caso: ${taxCase.title}`,
    result: "SUCCESS",
    entityType: "Workflow",
    entityId: workflow.id,
    metadata: { caseId, sourceType: taxCase.sourceType, stepsCount: steps.length },
  }).catch(() => null);

  return workflow;
}
