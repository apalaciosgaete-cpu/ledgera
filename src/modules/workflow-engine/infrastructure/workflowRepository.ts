import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  type Workflow,
  type WorkflowStatus,
  type WorkflowStep,
  type WorkflowStepStatus,
  type WorkflowActionType,
} from "@/modules/workflow-engine/domain/workflow";

export function mapWorkflow(row: Record<string, unknown>, steps: WorkflowStep[] = []): Workflow {
  return {
    id: row.id as string,
    userId: row.userId as string,
    caseId: (row.caseId as string) ?? null,
    title: row.title as string,
    description: row.description as string,
    status: row.status as WorkflowStatus,
    sourceType: row.sourceType as string,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt as string),
    steps,
  };
}

export function mapStep(row: Record<string, unknown>): WorkflowStep {
  return {
    id: row.id as string,
    workflowId: row.workflowId as string,
    stepOrder: row.stepOrder as number,
    actionType: row.actionType as WorkflowActionType,
    status: row.status as WorkflowStepStatus,
    title: row.title as string,
    description: (row.description as string) ?? null,
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : null,
    result: (row.result as string) ?? null,
    executedAt: row.executedAt instanceof Date ? row.executedAt : row.executedAt ? new Date(row.executedAt as string) : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
  };
}

export async function findWorkflowsByUser(
  userId: string,
  filters?: { status?: string },
): Promise<Workflow[]> {
  const where: Prisma.WorkflowWhereInput = { userId };
  if (filters?.status) where.status = filters.status;

  const rows = await prisma.workflow.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  return rows.map((r) =>
    mapWorkflow(
      r as unknown as Record<string, unknown>,
      (r as unknown as { steps: Record<string, unknown>[] }).steps.map(mapStep),
    ),
  );
}

export async function findWorkflowsExpert(
  filters?: { status?: string; userId?: string },
): Promise<Workflow[]> {
  const where: Prisma.WorkflowWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.userId) where.userId = filters.userId;

  const rows = await prisma.workflow.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  return rows.map((r) =>
    mapWorkflow(
      r as unknown as Record<string, unknown>,
      (r as unknown as { steps: Record<string, unknown>[] }).steps.map(mapStep),
    ),
  );
}

export async function findWorkflowById(id: string): Promise<Workflow | null> {
  const row = await prisma.workflow.findFirst({
    where: { id },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
  if (!row) return null;
  return mapWorkflow(
    row as unknown as Record<string, unknown>,
    (row as unknown as { steps: Record<string, unknown>[] }).steps.map(mapStep),
  );
}

export async function findWorkflowByIdForUser(id: string, userId: string): Promise<Workflow | null> {
  const row = await prisma.workflow.findFirst({
    where: { id, userId },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
  if (!row) return null;
  return mapWorkflow(
    row as unknown as Record<string, unknown>,
    (row as unknown as { steps: Record<string, unknown>[] }).steps.map(mapStep),
  );
}

export async function createWorkflow(data: {
  userId: string;
  caseId: string | null;
  title: string;
  description: string;
  sourceType: string;
  steps: {
    stepOrder: number;
    actionType: string;
    title: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
  }[];
}): Promise<Workflow> {
  const created = await prisma.workflow.create({
    data: {
      userId: data.userId,
      caseId: data.caseId,
      title: data.title,
      description: data.description,
      status: "PENDING",
      sourceType: data.sourceType,
      steps: {
        create: data.steps.map((s) => ({
          stepOrder: s.stepOrder,
          actionType: s.actionType,
          status: "PENDING",
          title: s.title,
          description: s.description,
          metadata: s.metadata ?? undefined,
        })) as Prisma.WorkflowStepCreateNestedManyWithoutWorkflowInput["create"],
      },
    },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  return mapWorkflow(
    created as unknown as Record<string, unknown>,
    (created as unknown as { steps: Record<string, unknown>[] }).steps.map(mapStep),
  );
}

export async function updateWorkflowStatus(
  id: string,
  status: WorkflowStatus,
): Promise<void> {
  await prisma.workflow.update({
    where: { id },
    data: { status },
  });
}

export async function updateStepStatus(
  stepId: string,
  status: WorkflowStepStatus,
  result?: string | null,
): Promise<void> {
  await prisma.workflowStep.update({
    where: { id: stepId },
    data: {
      status,
      result: result ?? undefined,
      executedAt: status === "SUCCESS" || status === "FAILED" ? new Date() : undefined,
    },
  });
}
