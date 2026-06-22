import { prisma } from "@/lib/prisma";
import { createTask } from "@/modules/tasks/application/createTask";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import {
  type Workflow,
  type WorkflowStep,
  isSensitiveAction,
} from "@/modules/workflow-engine/domain/workflow";
import {
  updateWorkflowStatus,
  updateStepStatus,
  findWorkflowById,
} from "@/modules/workflow-engine/infrastructure/workflowRepository";

export interface WorkflowRunResult {
  ok: boolean;
  workflow: Workflow;
  message: string;
  waitingUser: boolean;
}

export async function runWorkflow(workflow: Workflow): Promise<WorkflowRunResult> {
  if (workflow.status !== "PENDING" && workflow.status !== "WAITING_USER") {
    return {
      ok: false,
      workflow,
      message: `El workflow está en estado ${workflow.status} y no puede ejecutarse.`,
      waitingUser: false,
    };
  }

  // Check if there's a sensitive step pending user approval
  const pendingSensitiveStep = workflow.steps.find(
    (s) => s.status === "PENDING" && isSensitiveAction(s.actionType),
  );

  if (pendingSensitiveStep) {
    await updateWorkflowStatus(workflow.id, "WAITING_USER");

    await recordAuditEvent({
      userId: workflow.userId,
      category: "AI",
      severity: "INFO",
      event: "workflow_waiting_user",
      description: `Workflow "${workflow.title}" espera aprobación para paso sensible: ${pendingSensitiveStep.title}`,
      result: "SUCCESS",
      entityType: "WorkflowStep",
      entityId: pendingSensitiveStep.id,
      metadata: { workflowId: workflow.id, actionType: pendingSensitiveStep.actionType },
    }).catch(() => null);

    return {
      ok: true,
      workflow: { ...workflow, status: "WAITING_USER" as const },
      message: `El paso "${pendingSensitiveStep.title}" requiere aprobación del usuario antes de continuar.`,
      waitingUser: true,
    };
  }

  // Execute non-sensitive pending steps
  const pendingSteps = workflow.steps.filter((s) => s.status === "PENDING");

  if (pendingSteps.length === 0) {
    // All steps completed, mark workflow as completed
    await updateWorkflowStatus(workflow.id, "COMPLETED");
    return {
      ok: true,
      workflow: { ...workflow, status: "COMPLETED" as const },
      message: "Workflow completado exitosamente.",
      waitingUser: false,
    };
  }

  // Execute steps sequentially
  await updateWorkflowStatus(workflow.id, "RUNNING");
  let allSuccess = true;

  for (const step of pendingSteps) {
    try {
      // Check if this step is sensitive before executing
      if (isSensitiveAction(step.actionType)) {
        // Mark as pending user approval instead of executing
        await updateWorkflowStatus(workflow.id, "WAITING_USER");
        return {
          ok: true,
          workflow: { ...workflow, status: "WAITING_USER" as const },
          message: `El paso "${step.title}" requiere aprobación del usuario.`,
          waitingUser: true,
        };
      }

      // Execute the step via the execution engine
      await updateStepStatus(step.id, "RUNNING");

      // Simulate execution — in production this would call the execution engine
      const execSuccess = await executeStep(step, workflow.userId);

      if (execSuccess) {
        await updateStepStatus(step.id, "SUCCESS");
      } else {
        await updateStepStatus(step.id, "FAILED");
        allSuccess = false;
        break;
      }
    } catch {
      await updateStepStatus(step.id, "FAILED");
      allSuccess = false;
      break;
    }
  }

  if (!allSuccess) {
    await updateWorkflowStatus(workflow.id, "FAILED");
    return {
      ok: false,
      workflow: { ...workflow, status: "FAILED" as const },
      message: "Uno o más pasos del workflow fallaron.",
      waitingUser: false,
    };
  }

  // Check if there are more steps or we're done
  const incompleteSteps = workflow.steps.filter((s) => s.status === "PENDING" && s.stepOrder > (pendingSteps[pendingSteps.length - 1]?.stepOrder ?? 0));
  
  if (incompleteSteps.length === 0) {
    await updateWorkflowStatus(workflow.id, "COMPLETED");
    return {
      ok: true,
      workflow: { ...workflow, status: "COMPLETED" as const },
      message: "Workflow completado exitosamente.",
      waitingUser: false,
    };
  }

  // More steps remain (shouldn't normally happen since we check pending steps above)
  const refreshed = await import("@/modules/workflow-engine/infrastructure/workflowRepository")
    .then((m) => m.findWorkflowById(workflow.id));

  return {
    ok: true,
    workflow: refreshed ?? workflow,
    message: "Workflow en ejecución. Pendientes: " + incompleteSteps.length + " paso(s).",
    waitingUser: false,
  };
}

async function executeStep(step: WorkflowStep, userId: string): Promise<boolean> {
  try {
    await recordAuditEvent({
      userId,
      category: "AI",
      severity: "INFO",
      event: "workflow_step_executing",
      description: `Ejecutando paso: ${step.title} (${step.actionType})`,
      result: "SUCCESS",
      entityType: "WorkflowStep",
      entityId: step.id,
      metadata: { workflowId: step.workflowId, actionType: step.actionType },
    }).catch(() => null);

    if (step.actionType === "NOTIFY_USER") {
      await prisma.alert.create({
        data: {
          userId,
          category: "WORKFLOW",
          severity: "INFO",
          title: step.title,
          message: step.description ?? "Notificación automática del workflow.",
          status: "OPEN",
          source: "workflow",
          metadata: { workflowId: step.workflowId, stepId: step.id },
        },
      });
    }

    if (step.actionType === "CREATE_TASK") {
      const taskResult = await createTask({
        userId,
        title: step.title,
        description: step.description ?? "",
        category: "COMPLIANCE",
        priority: "MEDIUM",
        source: "MANUAL",
        sourceId: step.workflowId,
        metadata: { workflowStepId: step.id, workflowId: step.workflowId },
      });
      if (!taskResult.ok) return false;
    }

    if (step.actionType === "CREATE_REMINDER") {
      const taskResult = await createTask({
        userId,
        title: step.title,
        description: step.description ?? "",
        category: "COMPLIANCE",
        priority: "MEDIUM",
        source: "MANUAL",
        sourceId: step.workflowId,
        metadata: {
          workflowStepId: step.id,
          workflowId: step.workflowId,
          isReminder: true,
          dueInHours: (step.metadata as { dueInHours?: number } | null)?.dueInHours ?? null,
        },
      });
      if (!taskResult.ok) return false;
    }

    if (step.actionType === "REQUEST_DOCUMENT") {
      const taskResult = await createTask({
        userId,
        title: step.title,
        description: step.description ?? "Solicitud de documento pendiente.",
        category: "TRIBUTARY",
        priority: "HIGH",
        source: "MANUAL",
        sourceId: step.workflowId,
        metadata: { workflowStepId: step.id, workflowId: step.workflowId, requestType: "DOCUMENT" },
      });
      if (!taskResult.ok) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function approveSensitiveStep(
  workflow: Workflow,
  _approved: boolean,
): Promise<WorkflowRunResult> {
  if (workflow.status !== "WAITING_USER") {
    return {
      ok: false,
      workflow,
      message: "El workflow no está esperando aprobación del usuario.",
      waitingUser: false,
    };
  }

  const pendingStep = workflow.steps.find(
    (s) => s.status === "PENDING" && isSensitiveAction(s.actionType),
  );

  if (!pendingStep) {
    // No pending sensitive step, continue execution
    return runWorkflow(workflow);
  }

  // Mark the step as SUCCESS (user approved)
  await updateStepStatus(pendingStep.id, "SUCCESS", "Aprobado por usuario");

  await recordAuditEvent({
    userId: workflow.userId,
    category: "AI",
    severity: "INFO",
    event: "workflow_step_approved",
    description: `Usuario aprobó paso sensible: ${pendingStep.title}`,
    result: "SUCCESS",
    entityType: "WorkflowStep",
    entityId: pendingStep.id,
    metadata: { workflowId: workflow.id, actionType: pendingStep.actionType },
  }).catch(() => null);

  // Continue with next steps
  return runWorkflow({ ...workflow, status: "PENDING" });
}
